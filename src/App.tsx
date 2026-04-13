import React, { useState } from "react";
import { SchemaEditor } from "./components/SchemaEditor";
import { DriftCard } from "./components/DriftCard";
import { DiffStats } from "./components/DiffStats";
import { SummaryBar } from "./components/SummaryBar";
import { diffSchemas } from "./utils/differ";
import { explainDiffs, DriftResult } from "./utils/api";

const GROQ_API_KEY =
  ((import.meta as unknown) as { env: Record<string, string> }).env
    ?.VITE_GROQ_API_KEY ?? "";

const SAMPLES: Record<string, { label: string; old: string; new: string }> = {
  sql: {
    label: "SQL DDL",
    old: `CREATE TABLE transactions (
    transaction_id  VARCHAR(36)    NOT NULL,
    account_id      INTEGER        NOT NULL,
    amount          DECIMAL(10,2)  NOT NULL,
    currency        CHAR(3)        NOT NULL DEFAULT 'USD',
    txn_type        VARCHAR(20)    NOT NULL,
    status          VARCHAR(10)    NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW(),
    description     TEXT
);`,
    new: `CREATE TABLE transactions (
    transaction_id  BIGINT         NOT NULL,
    account_id      INTEGER        NOT NULL,
    amount          VARCHAR(20)    NOT NULL,
    txn_type        VARCHAR(20)    NOT NULL,
    status          VARCHAR(20)    NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMP,
    description     VARCHAR(500),
    merchant_id     INTEGER        NOT NULL
);`,
  },
  json: {
    label: "JSON Schema",
    old: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["order_id", "customer_id", "amount"],
  "properties": {
    "order_id": { "type": "string" },
    "customer_id": { "type": "integer" },
    "amount": { "type": "number" },
    "currency": { "type": "string" },
    "status": { "type": "string" }
  }
}`,
    new: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["order_id", "customer_id", "amount", "region"],
  "properties": {
    "order_id": { "type": "integer" },
    "customer_id": { "type": "integer" },
    "amount": { "type": "string" },
    "region": { "type": "string" },
    "updated_at": { "type": "string" }
  }
}`,
  },
  avro: {
    label: "Avro Schema",
    old: `{
  "type": "record",
  "name": "UserEvent",
  "namespace": "com.company.events",
  "fields": [
    { "name": "user_id", "type": "string" },
    { "name": "event_type", "type": "string" },
    { "name": "timestamp", "type": "long" },
    { "name": "session_id", "type": ["null", "string"], "default": null }
  ]
}`,
    new: `{
  "type": "record",
  "name": "UserEvent",
  "namespace": "com.company.analytics",
  "fields": [
    { "name": "user_id", "type": "long" },
    { "name": "event_type", "type": "string" },
    { "name": "timestamp", "type": "long" },
    { "name": "geo_country", "type": "string" }
  ]
}`,
  },
};

export default function App() {
  const [oldSchema, setOldSchema] = useState("");
  const [newSchema, setNewSchema] = useState("");
  const [results, setResults] = useState<DriftResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oldFieldCount, setOldFieldCount] = useState(0);
  const [newFieldCount, setNewFieldCount] = useState(0);
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    if (!oldSchema.trim() || !newSchema.trim()) {
      setError("Please paste both schemas before analyzing.");
      return;
    }
    setError(null);
    setIsLoading(true);
    setResults([]);
    setAnalyzed(false);

    try {
      const diffs = diffSchemas(oldSchema, newSchema);
      const removed = diffs.filter((d) => d.changeType === "field_removed").length;
      const added = diffs.filter((d) => d.changeType === "field_added").length;
      const changed = diffs.filter((d) => d.changeType !== "field_removed" && d.changeType !== "field_added").length;
      setOldFieldCount(removed + changed);
      setNewFieldCount(added + changed);

      if (diffs.length === 0) {
        setAnalyzed(true);
        setIsLoading(false);
        return;
      }

      const explained = await explainDiffs(diffs, GROQ_API_KEY);
      setResults(explained);
      setAnalyzed(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed. Check your schema format.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = (key: string) => {
    const s = SAMPLES[key];
    if (!s) return;
    setOldSchema(s.old);
    setNewSchema(s.new);
    setActiveSample(key);
    setResults([]);
    setError(null);
    setAnalyzed(false);
  };

  const handleClear = () => {
    setOldSchema("");
    setNewSchema("");
    setResults([]);
    setError(null);
    setActiveSample(null);
    setAnalyzed(false);
  };

  const canAnalyze = oldSchema.trim().length > 5 && newSchema.trim().length > 5;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8f7f4",
      color: "#1a1916",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=Fraunces:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #e8e4d9; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4d0c8; border-radius: 99px; }
        .sample-btn:hover { background: #f0ede6 !important; border-color: #c4bfb2 !important; }
        .analyze-btn:hover:not(:disabled) { background: #2d2a24 !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(26,25,22,0.15) !important; }
        .analyze-btn { transition: all 0.2s ease !important; }
        .clear-btn:hover { background: #f0ede6 !important; }
        .neha-link { transition: color 0.15s !important; }
        .neha-link:hover { color: #1a1916 !important; }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid #e8e4d9",
        background: "#ffffff",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 0 #e8e4d9",
      }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, background: "#1a1916", borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="5" height="2.5" rx="0.75" fill="white" opacity="0.9"/>
                <rect x="1" y="7" width="5" height="2.5" rx="0.75" fill="white" opacity="0.4"/>
                <rect x="8" y="3" width="5" height="2.5" rx="0.75" fill="#a78bfa"/>
                <rect x="8" y="7" width="5" height="4" rx="0.75" fill="#a78bfa"/>
                <line x1="7" y1="2.5" x2="7" y2="13" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em", color: "#1a1916" }}>
                Schema Drift Explainer
              </div>
              <div style={{ fontSize: 11, color: "#9b9690", marginTop: -1 }}>Month 2 of 12 · DataForge Series</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <a
              href="https://www.linkedin.com/in/neha-rani-r/"
              target="_blank"
              rel="noopener noreferrer"
              className="neha-link"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 8,
                fontSize: 13, color: "#6b6860", textDecoration: "none",
                border: "1px solid #e8e4d9", background: "#fafaf9",
                fontWeight: 500,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
              Neha Rani
            </a>
            <a
              href="https://github.com/neha-rani-r/schema-drift-explainer"
              target="_blank"
              rel="noopener noreferrer"
              className="neha-link"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 8,
                fontSize: 13, color: "#6b6860", textDecoration: "none",
                border: "1px solid #e8e4d9", background: "#fafaf9",
                fontWeight: 500,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 32px 80px" }}>

        {/* Hero */}
        <div style={{ marginBottom: 36, maxWidth: 560 }}>
          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 36, fontWeight: 700,
            letterSpacing: "-0.03em", lineHeight: 1.15,
            color: "#1a1916", marginBottom: 12,
          }}>
            Spot schema drift before<br />it breaks your pipeline.
          </h1>
          <p style={{ fontSize: 15, color: "#6b6860", lineHeight: 1.65 }}>
            Paste two schemas — JSON Schema, Avro, or SQL DDL. Get a deterministic breakdown of every change: what drifted, what broke, and exactly how to fix it.
          </p>
        </div>

        {/* Sample buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#9b9690", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Try a sample:</span>
          {Object.entries(SAMPLES).map(([key, s]) => (
            <button
              key={key}
              className="sample-btn"
              onClick={() => handleLoadSample(key)}
              style={{
                padding: "5px 14px", borderRadius: 99,
                border: `1px solid ${activeSample === key ? "#1a1916" : "#ddd9d0"}`,
                background: activeSample === key ? "#1a1916" : "#ffffff",
                fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                color: activeSample === key ? "#ffffff" : "#6b6860",
                cursor: "pointer", fontWeight: activeSample === key ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Editors */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <SchemaEditor
            label="Old Schema"
            sublabel="baseline / production"
            value={oldSchema}
            onChange={(v) => { setOldSchema(v); setActiveSample(null); }}
            accentColor="#e8e4d9"
          />
          <SchemaEditor
            label="New Schema"
            sublabel="proposed / updated"
            value={newSchema}
            onChange={(v) => { setNewSchema(v); setActiveSample(null); }}
            accentColor="#b8d4c8"
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 36 }}>
          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={!canAnalyze || isLoading}
            style={{
              background: canAnalyze && !isLoading ? "#1a1916" : "#e8e4d9",
              color: canAnalyze && !isLoading ? "#ffffff" : "#9b9690",
              border: "none", borderRadius: 10,
              padding: "12px 32px", fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600, cursor: canAnalyze && !isLoading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 8,
              minWidth: 200, justifyContent: "center",
            }}
          >
            {isLoading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: "spin 0.8s linear infinite" }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Analyzing…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                Detect Schema Drift
              </>
            )}
          </button>
          {(oldSchema || newSchema) && (
            <button
              className="clear-btn"
              onClick={handleClear}
              style={{
                background: "#ffffff", color: "#6b6860",
                border: "1px solid #e8e4d9", borderRadius: 10,
                padding: "12px 20px", fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fdf2f1", border: "1px solid #f5c6c2",
            borderRadius: 10, padding: "12px 16px",
            color: "#c0392b", fontSize: 13, marginBottom: 20,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {(results.length > 0 || isLoading) && (
          <>
            <SummaryBar results={results} isLoading={isLoading} />
            {results.length > 0 && (
              <DiffStats results={results} oldFieldCount={oldFieldCount} newFieldCount={newFieldCount} />
            )}
            {results.map((r, i) => (
              <DriftCard key={`${r.field}-${i}`} result={r} />
            ))}
          </>
        )}

        {/* No changes */}
        {!isLoading && analyzed && results.length === 0 && (
          <div style={{
            background: "#f0faf5", border: "1px solid #b3dfc8",
            borderRadius: 12, padding: "24px 32px",
            textAlign: "center", color: "#1d6a4a", fontSize: 14,
          }}>
            ✅ No schema changes detected — schemas are identical.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !analyzed && !oldSchema && !newSchema && (
          <div style={{
            border: "1.5px dashed #ddd9d0", borderRadius: 14,
            padding: "56px 32px", textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.3 }}>⇄</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: "#6b6860", marginBottom: 8 }}>
              Paste two schemas to get started
            </div>
            <p style={{ fontSize: 13, color: "#9b9690", maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
              Or click a sample above to see a live example. Detects type changes, removed fields, nullability shifts, enum drift, and more.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
              {["Type changes", "Removed fields", "Nullability", "Enum drift", "Default changes"].map(tag => (
                <span key={tag} style={{
                  padding: "4px 12px", borderRadius: 99,
                  background: "#f0ede6", border: "1px solid #e8e4d9",
                  fontSize: 12, color: "#9b9690",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #e8e4d9",
        background: "#ffffff",
        padding: "20px 32px",
        textAlign: "center",
        fontSize: 13,
        color: "#9b9690",
      }}>
        Built by{" "}
        <a
          href="https://www.linkedin.com/in/neha-rani-r/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#1a1916", textDecoration: "none", fontWeight: 600 }}
        >
          Neha Rani
        </a>
        {" "}· Month 2 of 12 · DataForge Series · Powered by Llama 3.1 8B via Groq
      </footer>
    </div>
  );
}
