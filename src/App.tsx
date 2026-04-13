// App.tsx — Wires deterministic differ + LLM explanation layer
import React, { useState } from "react";
import { SchemaEditor } from "./components/SchemaEditor";
import { DriftCard } from "./components/DriftCard";
import { DiffStats } from "./components/DiffStats";
import { SummaryBar } from "./components/SummaryBar";
import { diffSchemas, detectFormat } from "./utils/differ";
import { explainDiffs, DriftResult } from "./utils/api";

const GROQ_API_KEY = ((import.meta as unknown) as { env: Record<string, string> }).env?.VITE_GROQ_API_KEY || "";

export default function App() {
  const [oldSchema, setOldSchema] = useState("");
  const [newSchema, setNewSchema] = useState("");
  const [results, setResults] = useState<DriftResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oldFieldCount, setOldFieldCount] = useState(0);
  const [newFieldCount, setNewFieldCount] = useState(0);

  const handleAnalyze = async () => {
    if (!oldSchema.trim() || !newSchema.trim()) {
      setError("Please paste both schemas before analyzing.");
      return;
    }
    setError(null);
    setIsLoading(true);
    setResults([]);

    try {
      // Step 1: Deterministic diff (no LLM, no hallucination)
      const diffs = diffSchemas(oldSchema, newSchema);

      // Track field counts for DiffStats
      const oldFmt = detectFormat(oldSchema);
      const newFmt = detectFormat(newSchema);
      // Simple heuristic: count top-level fields
      setOldFieldCount(diffs.filter((d) => d.changeType !== "field_added").length + diffs.filter((d) => d.changeType === "field_removed").length);
      setNewFieldCount(diffs.filter((d) => d.changeType !== "field_removed").length + diffs.filter((d) => d.changeType === "field_added").length);

      if (diffs.length === 0) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      // Step 2: LLM explains pre-computed diffs (graceful fallback if unavailable)
      const explained = await explainDiffs(diffs, GROQ_API_KEY);
      setResults(explained);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed. Check your schema format.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setOldSchema("");
    setNewSchema("");
    setResults([]);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e2e8f0",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#f1f5f9" }}>
            Schema Drift Explainer
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#475569" }}>
            Deterministic change detection · AI-powered explanations · JSON Schema · Avro · SQL DDL
          </p>
        </div>

        {/* Editors */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
          <SchemaEditor label="Old Schema" value={oldSchema} onChange={setOldSchema} />
          <SchemaEditor label="New Schema" value={newSchema} onChange={setNewSchema} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            style={{
              background: isLoading ? "#1e293b" : "#6366f1",
              color: isLoading ? "#475569" : "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {isLoading ? "Analyzing…" : "Analyze Drift"}
          </button>
          <button
            onClick={handleClear}
            style={{
              background: "transparent",
              color: "#64748b",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "10px 18px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#450a0a",
              border: "1px solid #ef444433",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#f87171",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {/* Results */}
        {(results.length > 0 || isLoading) && (
          <>
            <SummaryBar results={results} isLoading={isLoading} />
            {results.length > 0 && (
              <DiffStats
                results={results}
                oldFieldCount={oldFieldCount}
                newFieldCount={newFieldCount}
              />
            )}
            {results.map((r, i) => (
              <DriftCard key={`${r.field}-${i}`} result={r} />
            ))}
          </>
        )}

        {/* Empty state */}
        {!isLoading && results.length === 0 && oldSchema && newSchema && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#475569",
              fontSize: "14px",
            }}
          >
            ✅ No schema changes detected between the two versions.
          </div>
        )}
      </div>
    </div>
  );
}
