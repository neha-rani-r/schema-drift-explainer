// api.ts — LLM is used ONLY for explaining pre-computed diffs
// Change detection happens in differ.ts (deterministic)

import { FieldDiff, Severity } from "./differ";

export interface DriftResult {
  field: string;
  changeType: string;
  severity: Severity;
  oldValue?: string;
  newValue?: string;
  whyItMatters: string;
  howToFix: string;
  confidence: "deterministic" | "inferred";
  category: string;
}

// Fallback explanations when LLM is unavailable
function fallbackExplanation(diff: FieldDiff): { whyItMatters: string; howToFix: string } {
  switch (diff.changeType) {
    case "field_removed":
      return {
        whyItMatters: `The field "${diff.field}" has been removed. Any consumers reading this field will throw errors or receive null values unexpectedly.`,
        howToFix: `Deprecate the field first (mark as optional, keep it for 1–2 release cycles). Coordinate removal with all downstream consumers before deleting.`,
      };
    case "type_change":
      return {
        whyItMatters: `"${diff.field}" changed from ${diff.oldValue} to ${diff.newValue}. Implicit type coercion may silently corrupt values or cause runtime cast errors downstream.`,
        howToFix: `Add a migration step to cast existing data. Update all consumers to handle the new type before deploying the schema change.`,
      };
    case "nullability_change":
      return {
        whyItMatters: `"${diff.field}" changed nullability from ${diff.oldValue} to ${diff.newValue}. ${
          diff.newValue === "not-null"
            ? "Existing null values will fail validation and break inserts/updates."
            : "Downstream code that assumed non-null values may not handle nulls correctly."
        }`,
        howToFix: `${
          diff.newValue === "not-null"
            ? "Backfill null values before applying the constraint. Add a NOT NULL migration that runs after backfill."
            : "Audit downstream consumers for null-handling logic before relaxing the constraint."
        }`,
      };
    case "field_added":
      return {
        whyItMatters: `New field "${diff.field}" (${diff.newValue}) added. Generally backward-compatible but consumers doing strict schema validation may reject messages with unknown fields.`,
        howToFix: `Ensure new field has a default value or is nullable. Update strict-mode consumers (Avro, Protobuf) to register the new schema version.`,
      };
    case "default_change":
      return {
        whyItMatters: `Default value for "${diff.field}" changed from ${diff.oldValue} to ${diff.newValue}. New records will use the new default; existing records are unaffected.`,
        howToFix: `Verify that downstream aggregations or reports that assumed the old default still behave correctly with the new one.`,
      };
    case "enum_change":
      return {
        whyItMatters: `Enum values for "${diff.field}" changed. Code with exhaustive switch/case statements will fail on unknown variants.`,
        howToFix: `Add the new enum value to all consumers first. Only remove old enum values after confirming no active data uses them.`,
      };
    default:
      return {
        whyItMatters: `"${diff.field}" has changed (${diff.changeType}). Review downstream consumers for compatibility.`,
        howToFix: `Audit all systems that read or write this field and test with the new schema before deploying to production.`,
      };
  }
}

export async function explainDiffs(
  diffs: FieldDiff[],
  groqApiKey: string
): Promise<DriftResult[]> {
  if (diffs.length === 0) return [];

  // Try LLM for richer explanations
  try {
    const prompt = `You are a senior data engineer reviewing schema changes. For each schema diff below, write:
1. "whyItMatters": 1-2 sentences on the real-world impact (data corruption, pipeline failures, downstream breaks)
2. "howToFix": 1-2 concrete actionable steps

Respond with ONLY a JSON array, no markdown, no explanation. One object per diff.

Diffs:
${JSON.stringify(diffs, null, 2)}

Response format (array, same order as input):
[{"whyItMatters": "...", "howToFix": "..."}, ...]`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Use 8B — faster, cheaper, sufficient for explanation
        max_tokens: 1500,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const explanations: Array<{ whyItMatters: string; howToFix: string }> =
      JSON.parse(clean);

    return diffs.map((diff, i) => ({
      ...diff,
      whyItMatters: explanations[i]?.whyItMatters || fallbackExplanation(diff).whyItMatters,
      howToFix: explanations[i]?.howToFix || fallbackExplanation(diff).howToFix,
    }));
  } catch (err) {
    console.warn("LLM explanation failed, using fallback:", err);
    // Graceful degradation — tool still works without LLM
    return diffs.map((diff) => ({
      ...diff,
      ...fallbackExplanation(diff),
    }));
  }
}
