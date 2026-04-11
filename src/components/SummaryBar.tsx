// SummaryBar.tsx — Shows green backward-compatible banner when no breaking changes
import React from "react";
import { DriftResult } from "../utils/api";

interface Props {
  results: DriftResult[];
  isLoading: boolean;
}

export const SummaryBar: React.FC<Props> = ({ results, isLoading }) => {
  if (isLoading) {
    return (
      <div
        style={{
          padding: "14px 18px",
          background: "#0f172a",
          borderRadius: "10px",
          border: "1px solid #1e293b",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
        Analyzing schema changes…
      </div>
    );
  }

  if (results.length === 0) return null;

  const breaking = results.filter((r) => r.severity === "breaking").length;
  const warning = results.filter((r) => r.severity === "warning").length;
  const isCompatible = breaking === 0;

  return (
    <div
      style={{
        padding: "14px 18px",
        background: isCompatible ? "#022c22" : "#450a0a",
        borderRadius: "10px",
        border: `1px solid ${isCompatible ? "#10b98133" : "#ef444433"}`,
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <span style={{ fontSize: "20px" }}>{isCompatible ? "✅" : "🚨"}</span>
      <div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: isCompatible ? "#34d399" : "#f87171",
          }}
        >
          {isCompatible
            ? "Backward Compatible — No breaking changes detected"
            : `${breaking} Breaking Change${breaking !== 1 ? "s" : ""} Detected`}
        </div>
        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
          {results.length} total change{results.length !== 1 ? "s" : ""}
          {warning > 0 ? ` · ${warning} warning${warning !== 1 ? "s" : ""}` : ""}
          {" · All changes detected deterministically"}
        </div>
      </div>
    </div>
  );
};
