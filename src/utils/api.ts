import type { DriftReport } from '../types';

const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://schema-drift-proxy.YOUR_SUBDOMAIN.workers.dev';

const SYSTEM_PROMPT = `You are a senior data engineer specializing in schema evolution, backward/forward compatibility, and data pipeline reliability. 

Analyze two schemas and identify all drifts. For EACH drift, respond only with a valid JSON object matching this exact structure:

{
  "summary": "1-2 sentence executive summary of the drift impact",
  "schemaType": "detected schema type e.g. JSON Schema / Apache Avro / SQL DDL",
  "breakingCount": <number>,
  "warningCount": <number>,
  "safeCount": <number>,
  "migrationNote": "2-3 sentence migration strategy overview",
  "drifts": [
    {
      "id": "drift_1",
      "field": "field or property name",
      "changeType": "Type Changed / Field Removed / Field Added (Required) / Enum Value Removed / etc.",
      "severity": "breaking" | "warning" | "safe" | "info",
      "oldValue": "what it was before",
      "newValue": "what it is now",
      "whyItMatters": "specific downstream impact — what breaks, which consumers fail, what data gets corrupted",
      "howToFix": "concrete migration step or compatibility pattern to apply"
    }
  ]
}

Severity rules:
- breaking: existing consumers WILL fail — type changes, required fields added, fields removed, enum values removed, namespace changes
- warning: consumers MAY fail or produce incorrect data — format changes, constraint loosening, default value changes  
- safe: backward compatible — new optional fields, new enum values added, documentation changes
- info: metadata or structural changes with no runtime impact

Return ONLY the JSON object. No markdown, no preamble, no explanation outside the JSON.`;

export async function analyzeDrift(oldSchema: string, newSchema: string): Promise<DriftReport> {
  const userMessage = `Compare these two schemas and identify all drifts:

## OLD SCHEMA:
\`\`\`
${oldSchema}
\`\`\`

## NEW SCHEMA:
\`\`\`
${newSchema}
\`\`\`

Analyze thoroughly. Find ALL field-level changes. Be specific about downstream impact.`;

  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Worker error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('Empty response from AI');

  const cleaned = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as DriftReport;
    if (!parsed.drifts || !Array.isArray(parsed.drifts)) {
      throw new Error('Invalid response structure');
    }
    return parsed;
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }
}
