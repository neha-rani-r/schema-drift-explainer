import React, { useState } from "react";
import { DriftResult } from "../utils/api";

interface Props { result: DriftResult; }

const severityConfig = {
  breaking: { color: "#c0392b", bg: "#fdf2f1", border: "#f5c6c2", label: "BREAKING" },
  warning:  { color: "#a05a00", bg: "#fef9f0", border: "#f5dfa8", label: "WARNING"  },
  safe:     { color: "#1d6a4a", bg: "#f0faf5", border: "#b3dfc8", label: "SAFE"     },
  info:     { color: "#1a4d8c", bg: "#f0f5fd", border: "#b3ccf0", label: "INFO"     },
};

const categoryIcons: Record<string, string> = {
  "Type System": "🔢", "Schema Evolution": "📐",
  "Nullability": "◎", "Defaults": "⚙", "Enumerations": "≡",
  "Constraints": "🔒", "Nested Structure": "❐",
};

export const DriftCard: React.FC<Props> = ({ result }) => {
  const [expanded, setExpanded] = useState(result.severity === "breaking");
  const cfg = severityConfig[result.severity] ?? severityConfig.info;
  const icon = categoryIcons[result.category] ?? "·";

  return (
    <div style={{
      background: "#ffffff", borderRadius: 12,
      border: `1px solid ${cfg.border}`,
      borderLeft: `3px solid ${cfg.color}`,
      marginBottom: 8, overflow: "hidden",
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", background: "transparent", border: "none",
          padding: "13px 16px", display: "flex", alignItems: "center",
          gap: 10, textAlign: "left", cursor: "pointer",
          borderBottom: expanded ? `1px solid ${cfg.border}` : "none",
        }}
      >
        <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>

        <code style={{
          fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500,
          color: "#1a1916", background: "#f7f6f3",
          padding: "2px 8px", borderRadius: 5, flexShrink: 0,
        }}>
          {result.field}
        </code>

        <span style={{ fontSize: 12, color: "#9b9690", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {result.changeType.replace(/_/g, " ")}
        </span>

        {/* Severity badge */}
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          color: cfg.color, background: cfg.bg,
          padding: "2px 8px", borderRadius: 99,
          border: `1px solid ${cfg.border}`, whiteSpace: "nowrap",
        }}>
          {cfg.label}
        </span>

        {/* Confidence badge */}
        <span style={{
          fontSize: 10, color: result.confidence === "deterministic" ? "#7c6fcd" : "#9b9690",
          background: result.confidence === "deterministic" ? "#f0eeff" : "#f7f6f3",
          padding: "2px 7px", borderRadius: 99,
          border: `1px solid ${result.confidence === "deterministic" ? "#d4cef5" : "#e8e4d9"}`,
          fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap",
        }}>
          {result.confidence === "deterministic" ? "◈ det." : "◎ inf."}
        </span>

        <span style={{ fontSize: 12, color: "#9b9690", marginLeft: 4, transform: expanded ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>▾</span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Before / After */}
          {(result.oldValue || result.newValue) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <ValueBox label="Before" value={result.oldValue ?? "—"} variant="old" />
              <ValueBox label="After"  value={result.newValue ?? "—"} variant="new" />
            </div>
          )}

          <InfoRow icon="⚡" label="Why it matters" text={result.whyItMatters} color={cfg.color} />
          <InfoRow icon="→" label="How to fix"     text={result.howToFix}     color="#6b6860" />
        </div>
      )}
    </div>
  );
};

const ValueBox: React.FC<{ label: string; value: string; variant: "old" | "new" }> = ({ label, value, variant }) => (
  <div style={{
    borderRadius: 8, overflow: "hidden",
    border: `1px solid ${variant === "old" ? "#e8e4d9" : "#b3dfc8"}`,
  }}>
    <div style={{
      padding: "3px 10px", fontSize: 10, fontWeight: 600,
      letterSpacing: "0.06em", textTransform: "uppercase",
      background: variant === "old" ? "#f7f6f3" : "#f0faf5",
      color: variant === "old" ? "#9b9690" : "#1d6a4a",
      borderBottom: `1px solid ${variant === "old" ? "#e8e4d9" : "#b3dfc8"}`,
    }}>
      {label}
    </div>
    <div style={{
      padding: "8px 10px", fontFamily: "'DM Mono', monospace",
      fontSize: 12, color: "#2d2b27",
      background: variant === "old" ? "#fafaf9" : "#f7fdf9",
      minHeight: 32, wordBreak: "break-word",
    }}>
      {value || <em style={{ color: "#c4bfb2" }}>none</em>}
    </div>
  </div>
);

const InfoRow: React.FC<{ icon: string; label: string; text: string; color: string }> = ({ icon, label, text, color }) => (
  <div style={{ display: "flex", gap: 10 }}>
    <span style={{ fontSize: 13, color, flexShrink: 0, marginTop: 1 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b9690", marginBottom: 3, fontWeight: 600 }}>
        {label}
      </div>
      <p style={{ fontSize: 13, color: "#3d3b37", lineHeight: 1.65, margin: 0 }}>{text}</p>
    </div>
  </div>
);
