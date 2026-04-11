// DiffStats.tsx — Summary stats bar showing deterministic detection ratio
import React from "react";
import { DriftResult } from "../utils/api";

interface Props {
  results: DriftResult[];
  oldFieldCount: number;
  newFieldCount: number;
}

const severityColors: Record<string, string> = {
  breaking: "#ef4444",
  warning: "#f59e0b",
  safe: "#10b981",
  info: "#6366f1",
};

export const DiffStats: React.FC<Props> = ({ results, oldFieldCount, newFieldCount }) => {
  if (results.length === 0) return null;

  const deterministic = results.filter((r) => r.confidence === "deterministic").length;
  const breaking = results.filter((r) => r.severity === "breaking").length;
  const warning = results.filter((r) => r.severity === "warning").length;
  const safe = results.filter((r) => r.severity === "safe").length;
  const detRatio = Math.round((deterministic / results.length) * 100);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        padding: "14px 18px",
        background: "#0f172a",
        borderRadius: "10px",
        border: "1px solid #1e293b",
        marginBottom: "16px",
        alignItems: "center",
      }}
    >
      {/* Field delta */}
      <Stat
        label="Fields"
        value={`${oldFieldCount} → ${newFieldCount}`}
        sub={newFieldCount > oldFieldCount ? `+${newFieldCount - oldFieldCount}` : `${newFieldCount - oldFieldCount}`}
        subColor={newFieldCount >= oldFieldCount ? "#10b981" : "#ef4444"}
      />

      <Divider />

      {/* Severity breakdown */}
      {breaking > 0 && (
        <Stat label="Breaking" value={String(breaking)} subColor={severityColors.breaking} dot />
      )}
      {warning > 0 && (
        <Stat label="Warning" value={String(warning)} subColor={severityColors.warning} dot />
      )}
      {safe > 0 && (
        <Stat label="Safe" value={String(safe)} subColor={severityColors.safe} dot />
      )}

      <Divider />

      {/* Confidence */}
      <Stat
        label="Deterministic"
        value={`${detRatio}%`}
        sub={`${deterministic}/${results.length} changes`}
        subColor="#94a3b8"
        badge="◈"
        badgeColor="#6366f1"
      />
    </div>
  );
};

interface StatProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  dot?: boolean;
  badge?: string;
  badgeColor?: string;
}

const Stat: React.FC<StatProps> = ({ label, value, sub, subColor, dot, badge, badgeColor }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
    <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {label}
    </span>
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      {dot && (
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: subColor, display: "inline-block" }} />
      )}
      {badge && (
        <span style={{ color: badgeColor, fontSize: "13px" }}>{badge}</span>
      )}
      <span style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9" }}>{value}</span>
      {sub && !dot && (
        <span style={{ fontSize: "12px", color: subColor || "#94a3b8" }}>{sub}</span>
      )}
    </div>
  </div>
);

const Divider: React.FC = () => (
  <div style={{ width: 1, height: 36, background: "#1e293b", margin: "0 4px" }} />
);
