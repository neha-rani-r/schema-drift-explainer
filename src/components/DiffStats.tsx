import React from "react";
import { DriftResult } from "../utils/api";

interface Props {
  results: DriftResult[];
  oldFieldCount: number;
  newFieldCount: number;
}

export const DiffStats: React.FC<Props> = ({ results, oldFieldCount, newFieldCount }) => {
  if (results.length === 0) return null;

  const deterministic = results.filter((r) => r.confidence === "deterministic").length;
  const breaking = results.filter((r) => r.severity === "breaking").length;
  const warning = results.filter((r) => r.severity === "warning").length;
  const safe = results.filter((r) => r.severity === "safe").length;
  const detRatio = Math.round((deterministic / results.length) * 100);
  const fieldDelta = newFieldCount - oldFieldCount;

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 10,
      padding: "14px 20px",
      background: "#ffffff", borderRadius: 12,
      border: "1px solid #e8e4d9",
      marginBottom: 16, alignItems: "center",
    }}>
      <Chip label="Fields" value={`${oldFieldCount} → ${newFieldCount}`}
        sub={fieldDelta >= 0 ? `+${fieldDelta}` : `${fieldDelta}`}
        subColor={fieldDelta >= 0 ? "#1d6a4a" : "#c0392b"} />
      <div style={{ width: 1, height: 32, background: "#e8e4d9" }} />
      {breaking > 0 && <Chip label="Breaking" value={String(breaking)} dot="#e74c3c" />}
      {warning > 0 && <Chip label="Warning" value={String(warning)} dot="#e67e22" />}
      {safe > 0 && <Chip label="Safe" value={String(safe)} dot="#27ae60" />}
      <div style={{ width: 1, height: 32, background: "#e8e4d9" }} />
      <Chip label="Deterministic" value={`${detRatio}%`}
        sub={`${deterministic}/${results.length} changes`} subColor="#9b9690"
        badge="◈" badgeColor="#7c6fcd" />
    </div>
  );
};

interface ChipProps {
  label: string; value: string;
  sub?: string; subColor?: string;
  dot?: string; badge?: string; badgeColor?: string;
}

const Chip: React.FC<ChipProps> = ({ label, value, sub, subColor, dot, badge, badgeColor }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 4px" }}>
    <span style={{ fontSize: 10, color: "#9b9690", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
      {label}
    </span>
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />}
      {badge && <span style={{ color: badgeColor, fontSize: 12 }}>{badge}</span>}
      <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1916", fontFamily: "'DM Mono', monospace" }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: subColor || "#9b9690" }}>{sub}</span>}
    </div>
  </div>
);
