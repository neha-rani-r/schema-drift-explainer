import React from "react";
import { DriftResult } from "../utils/api";

interface Props {
  results: DriftResult[];
  isLoading: boolean;
}

export const SummaryBar: React.FC<Props> = ({ results, isLoading }) => {
  if (isLoading) {
    return (
      <div style={{
        padding: "16px 20px", background: "#ffffff",
        borderRadius: 12, border: "1px solid #e8e4d9",
        marginBottom: 16, display: "flex", alignItems: "center",
        gap: 10, color: "#9b9690", fontSize: 14,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Running deterministic diff — no AI involved in change detection…
      </div>
    );
  }

  if (results.length === 0) return null;

  const breaking = results.filter((r) => r.severity === "breaking").length;
  const isCompatible = breaking === 0;

  return (
    <div style={{
      padding: "16px 20px",
      background: isCompatible ? "#f0faf5" : "#fdf2f1",
      borderRadius: 12,
      border: `1px solid ${isCompatible ? "#b3dfc8" : "#f5c6c2"}`,
      marginBottom: 16,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{isCompatible ? "✅" : "🚨"}</span>
      <div>
        <div style={{
          fontSize: 14, fontWeight: 700,
          color: isCompatible ? "#1d6a4a" : "#c0392b",
        }}>
          {isCompatible
            ? "Backward Compatible — no breaking changes detected"
            : `${breaking} Breaking Change${breaking !== 1 ? "s" : ""} Detected`}
        </div>
        <div style={{ fontSize: 12, color: "#9b9690", marginTop: 2 }}>
          {results.length} total change{results.length !== 1 ? "s" : ""} · All detected deterministically — zero hallucination
        </div>
      </div>
    </div>
  );
};
