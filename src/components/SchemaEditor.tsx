// SchemaEditor.tsx — Updated with live format detection badge
import React from "react";
import { detectFormat, SchemaFormat } from "../utils/differ";

interface Props {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const formatLabels: Record<SchemaFormat, { label: string; color: string }> = {
  "json-schema": { label: "JSON Schema", color: "#6366f1" },
  avro: { label: "Avro", color: "#f59e0b" },
  sql: { label: "SQL DDL", color: "#10b981" },
  unknown: { label: "Paste schema…", color: "#475569" },
};

export const SchemaEditor: React.FC<Props> = ({ label, value, onChange, placeholder }) => {
  const format = value.trim() ? detectFormat(value) : "unknown";
  const fmt = formatLabels[format];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </label>

        {/* Live format badge */}
        <span
          style={{
            fontSize: "11px",
            color: fmt.color,
            background: `${fmt.color}18`,
            border: `1px solid ${fmt.color}44`,
            padding: "2px 8px",
            borderRadius: "4px",
            fontFamily: "monospace",
            transition: "all 0.2s",
          }}
        >
          {fmt.label}
        </span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          placeholder ||
          `Paste JSON Schema, Avro, or SQL DDL here…

Example SQL:
CREATE TABLE orders (
  id INT NOT NULL,
  amount DECIMAL(10,2),
  status VARCHAR(20)
);`
        }
        style={{
          width: "100%",
          minHeight: "280px",
          background: "#0f172a",
          color: "#e2e8f0",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          padding: "14px",
          fontFamily: "monospace",
          fontSize: "13px",
          lineHeight: 1.6,
          resize: "vertical",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#334155")}
        onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
      />
    </div>
  );
};
