// DriftCard.tsx — Updated with confidence badge, severity left-border, category icon
import React, { useState } from "react";
import { DriftResult } from "../utils/api";

interface Props {
  result: DriftResult;
}

const severityConfig = {
  breaking: { color: "#ef4444", bg: "#450a0a", label: "BREAKING", border: "#ef4444" },
  warning: { color: "#f59e0b", bg: "#451a03", label: "WARNING", border: "#f59e0b" },
  safe: { color: "#10b981", bg: "#022c22", label: "SAFE", border: "#10b981" },
  info: { color: "#6366f1", bg: "#1e1b4b", label: "INFO", border: "#6366f1" },
};

const categoryIcons: Record<string, string> = {
  "Type System": "🔢",
  "Schema Evolution": "📐",
  "Nullability": "⚠️",
  "Defaults": "🔧",
  "Enumerations": "📋",
  "Constraints": "🔒",
  "Nested Structure": "🗂️",
};

export const DriftCard: React.FC<Props> = ({ result }) => {
  const [expanded, setExpanded] = useState(true);
  const cfg = severityConfig[result.severity] || severityConfig.info;
  const icon = categoryIcons[result.category] || "📌";

  return (
    <div
      style={{
        background: cfg.bg,
        borderRadius: "10px",
        border: `1px solid ${cfg.border}33`,
        borderLeft: `4px solid ${cfg.border}`,
        marginBottom: "12px",
        overflow: "hidden",
        transition: "all 0.2s",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 16px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: "18px" }}>{icon}</span>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <code
              style={{
                fontFamily: "monospace",
                fontSize: "14px",
                color: "#f1f5f9",
                fontWeight: 600,
              }}
            >
              {result.field}
            </code>

            {/* Severity badge */}
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: cfg.color,
                background: `${cfg.color}22`,
                padding: "2px 8px",
                borderRadius: "4px",
                border: `1px solid ${cfg.color}44`,
              }}
            >
              {cfg.label}
            </span>

            {/* Confidence badge */}
            <span
              style={{
                fontSize: "10px",
                color: result.confidence === "deterministic" ? "#818cf8" : "#94a3b8",
                background: result.confidence === "deterministic" ? "#1e1b4b" : "#1e293b",
                padding: "2px 7px",
                borderRadius: "4px",
                border: `1px solid ${result.confidence === "deterministic" ? "#4338ca44" : "#33415544"}`,
                fontFamily: "monospace",
              }}
            >
              {result.confidence === "deterministic" ? "◈ det." : "◎ inf."}
            </span>

            {/* Category */}
            <span style={{ fontSize: "11px", color: "#64748b" }}>{result.category}</span>
          </div>

          {/* Change summary */}
          {(result.oldValue || result.newValue) && (
            <div style={{ marginTop: "4px", fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" }}>
              {result.oldValue && (
                <span style={{ color: "#f87171" }}>− {result.oldValue}</span>
              )}
              {result.oldValue && result.newValue && (
                <span style={{ color: "#64748b" }}> → </span>
              )}
              {result.newValue && (
                <span style={{ color: "#4ade80" }}>+ {result.newValue}</span>
              )}
            </div>
          )}
        </div>

        <span style={{ color: "#475569", fontSize: "12px" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${cfg.border}22` }}>
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Why it matters
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1", lineHeight: 1.6 }}>
              {result.whyItMatters}
            </p>
          </div>
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              How to fix
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1", lineHeight: 1.6 }}>
              {result.howToFix}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
