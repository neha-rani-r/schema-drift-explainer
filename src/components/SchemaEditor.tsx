import React from "react";
import { detectFormat, SchemaFormat } from "../utils/differ";

interface Props {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (val: string) => void;
  accentColor?: string;
}

const formatLabels: Record<SchemaFormat, { label: string; color: string; bg: string }> = {
  "json-schema": { label: "JSON Schema", color: "#5b4fcf", bg: "#f0eeff" },
  avro:          { label: "Avro",         color: "#b45309", bg: "#fef9ee" },
  sql:           { label: "SQL DDL",      color: "#1d6a4a", bg: "#f0faf5" },
  unknown:       { label: "Auto-detect",  color: "#9b9690", bg: "#f7f6f3" },
};

export const SchemaEditor: React.FC<Props> = ({ label, sublabel, value, onChange, accentColor = "#e8e4d9" }) => {
  const format = value.trim() ? detectFormat(value) : "unknown";
  const fmt = formatLabels[format];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 8, borderBottom: `2px solid ${accentColor}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1916" }}>{label}</span>
          {sublabel && <span style={{ fontSize: 11, color: "#9b9690" }}>{sublabel}</span>}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.05em",
          textTransform: "uppercase", color: fmt.color,
          background: fmt.bg, padding: "2px 8px", borderRadius: 4,
          fontFamily: "'DM Mono', monospace",
          transition: "all 0.2s",
        }}>
          {fmt.label}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Paste ${label.toLowerCase()} here…\n\nSupports JSON Schema, Apache Avro, SQL DDL`}
        spellCheck={false}
        style={{
          width: "100%", height: 300, minHeight: 200,
          background: "#fafaf9", color: "#2d2b27",
          border: "1px solid #e8e4d9", borderRadius: 10,
          padding: "14px 16px",
          fontFamily: "'DM Mono', 'Fira Code', monospace",
          fontSize: 12.5, lineHeight: 1.7,
          resize: "vertical", outline: "none",
          transition: "border-color 0.15s, background 0.15s",
        }}
        onFocus={(e) => { e.target.style.borderColor = "#c4bfb2"; e.target.style.background = "#ffffff"; }}
        onBlur={(e) => { e.target.style.borderColor = "#e8e4d9"; e.target.style.background = "#fafaf9"; }}
      />
    </div>
  );
};
