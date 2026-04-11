// differ.ts — Deterministic schema parser and differ
// Handles JSON Schema, Apache Avro, SQL DDL
// LLM is NOT used here — all change detection is deterministic

export type SchemaFormat = "json-schema" | "avro" | "sql" | "unknown";

export type ChangeType =
  | "type_change"
  | "field_added"
  | "field_removed"
  | "constraint_change"
  | "nullability_change"
  | "default_change"
  | "enum_change"
  | "nested_change";

export type Severity = "breaking" | "warning" | "safe" | "info";

export interface FieldDiff {
  field: string;
  changeType: ChangeType;
  severity: Severity;
  oldValue?: string;
  newValue?: string;
  confidence: "deterministic" | "inferred";
  category: string;
}

// ─── Format Detection ────────────────────────────────────────────────────────

export function detectFormat(raw: string): SchemaFormat {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.type === "record" && parsed.fields) return "avro";
    if (parsed.$schema || parsed.properties || parsed.type) return "json-schema";
  } catch {
    // not JSON
  }
  if (/CREATE\s+TABLE/i.test(trimmed)) return "sql";
  return "unknown";
}

// ─── JSON Schema Parser ──────────────────────────────────────────────────────

interface FlatField {
  path: string;
  type: string;
  nullable: boolean;
  hasDefault: boolean;
  defaultValue?: unknown;
  enum?: string[];
}

function flattenJsonSchema(
  schema: Record<string, unknown>,
  prefix = ""
): FlatField[] {
  const fields: FlatField[] = [];
  const props = schema.properties as Record<string, unknown> | undefined;
  if (!props) return fields;

  const required = (schema.required as string[]) || [];

  for (const [key, val] of Object.entries(props)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const v = val as Record<string, unknown>;

    let type = "unknown";
    let nullable = !required.includes(key);

    if (v.anyOf || v.oneOf) {
      const union = ((v.anyOf || v.oneOf) as Array<Record<string, unknown>>);
      const nonNull = union.filter((u) => u.type !== "null");
      nullable = union.some((u) => u.type === "null");
      type = nonNull.map((u) => u.type as string).join("|") || "unknown";
    } else if (v.type) {
      type = Array.isArray(v.type)
        ? (v.type as string[]).filter((t) => t !== "null").join("|")
        : (v.type as string);
      if (Array.isArray(v.type)) nullable = (v.type as string[]).includes("null");
    } else if (v.$ref) {
      type = `$ref:${v.$ref}`;
    }

    fields.push({
      path,
      type,
      nullable,
      hasDefault: "default" in v,
      defaultValue: v.default,
      enum: v.enum as string[] | undefined,
    });

    if (v.properties) {
      fields.push(...flattenJsonSchema(v as Record<string, unknown>, path));
    }
    if (v.items && (v.items as Record<string, unknown>).properties) {
      fields.push(
        ...flattenJsonSchema(v.items as Record<string, unknown>, `${path}[]`)
      );
    }
  }
  return fields;
}

// ─── Avro Parser ─────────────────────────────────────────────────────────────

function flattenAvro(
  schema: Record<string, unknown>,
  prefix = ""
): FlatField[] {
  const fields: FlatField[] = [];
  const avroFields = schema.fields as Array<Record<string, unknown>> | undefined;
  if (!avroFields) return fields;

  for (const f of avroFields) {
    const path = prefix ? `${prefix}.${f.name}` : (f.name as string);
    let type = "unknown";
    let nullable = false;

    if (Array.isArray(f.type)) {
      nullable = (f.type as unknown[]).includes("null");
      const nonNull = (f.type as unknown[]).filter((t) => t !== "null");
      type =
        nonNull
          .map((t) =>
            typeof t === "string" ? t : (t as Record<string, unknown>).type as string
          )
          .join("|") || "unknown";
    } else if (typeof f.type === "string") {
      type = f.type;
    } else if (typeof f.type === "object" && f.type !== null) {
      const ft = f.type as Record<string, unknown>;
      if (ft.type === "record") {
        type = "record";
        fields.push(...flattenAvro(ft, path));
      } else if (ft.type === "enum") {
        type = `enum(${(ft.symbols as string[]).join(",")})`;
      } else if (ft.type === "array") {
        type = `array<${ft.items}>`;
      } else if (ft.type === "map") {
        type = `map<${ft.values}>`;
      } else {
        type = ft.type as string;
      }
    }

    fields.push({
      path,
      type,
      nullable,
      hasDefault: "default" in f,
      defaultValue: f.default,
    });
  }
  return fields;
}

// ─── SQL DDL Parser ───────────────────────────────────────────────────────────

function parseSql(ddl: string): FlatField[] {
  const fields: FlatField[] = [];
  const lines = ddl
    .replace(/CREATE\s+TABLE\s+\S+\s*\(/i, "")
    .replace(/\)\s*;?\s*$/, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l &&
        !/^(PRIMARY KEY|UNIQUE|INDEX|KEY|CONSTRAINT|CHECK)/i.test(l)
    );

  for (const line of lines) {
    const clean = line.replace(/,$/, "").trim();
    const match = clean.match(/^`?(\w+)`?\s+([A-Z]+(?:\([^)]*\))?)/i);
    if (!match) continue;
    const [, name, rawType] = match;
    const nullable = !/NOT NULL/i.test(clean);
    const hasDefault = /DEFAULT/i.test(clean);
    const defaultMatch = clean.match(/DEFAULT\s+([^\s,]+)/i);

    fields.push({
      path: name,
      type: rawType.toUpperCase(),
      nullable,
      hasDefault,
      defaultValue: defaultMatch?.[1],
    });
  }
  return fields;
}

// ─── Flatten Dispatcher ───────────────────────────────────────────────────────

function flatten(raw: string, format: SchemaFormat): FlatField[] {
  if (format === "json-schema") {
    return flattenJsonSchema(JSON.parse(raw));
  }
  if (format === "avro") {
    return flattenAvro(JSON.parse(raw));
  }
  if (format === "sql") {
    return parseSql(raw);
  }
  return [];
}

// ─── Severity Rules ───────────────────────────────────────────────────────────

function scoreSeverity(change: ChangeType, oldVal?: string, newVal?: string): Severity {
  if (change === "field_removed") return "breaking";
  if (change === "type_change") {
    // widening is usually safe, narrowing is breaking
    const safeWidenings = [
      ["INT", "BIGINT"],
      ["FLOAT", "DOUBLE"],
      ["VARCHAR", "TEXT"],
      ["integer", "number"],
    ];
    const isSafeWidening = safeWidenings.some(
      ([from, to]) => oldVal?.includes(from) && newVal?.includes(to)
    );
    return isSafeWidening ? "warning" : "breaking";
  }
  if (change === "nullability_change") {
    // nullable → not-null is breaking (existing nulls fail)
    return oldVal === "nullable" && newVal === "not-null" ? "breaking" : "warning";
  }
  if (change === "field_added") return "safe";
  if (change === "default_change") return "warning";
  if (change === "enum_change") return "warning";
  if (change === "constraint_change") return "warning";
  if (change === "nested_change") return "warning";
  return "info";
}

function categoryFor(change: ChangeType): string {
  const map: Record<ChangeType, string> = {
    type_change: "Type System",
    field_added: "Schema Evolution",
    field_removed: "Schema Evolution",
    constraint_change: "Constraints",
    nullability_change: "Nullability",
    default_change: "Defaults",
    enum_change: "Enumerations",
    nested_change: "Nested Structure",
  };
  return map[change];
}

// ─── Main Differ ──────────────────────────────────────────────────────────────

export function diffSchemas(oldRaw: string, newRaw: string): FieldDiff[] {
  const oldFmt = detectFormat(oldRaw);
  const newFmt = detectFormat(newRaw);

  const oldFields = flatten(oldRaw, oldFmt);
  const newFields = flatten(newRaw, newFmt !== "unknown" ? newFmt : oldFmt);

  const oldMap = new Map(oldFields.map((f) => [f.path, f]));
  const newMap = new Map(newFields.map((f) => [f.path, f]));

  const diffs: FieldDiff[] = [];

  // Removed fields
  for (const [path, old] of oldMap) {
    if (!newMap.has(path)) {
      diffs.push({
        field: path,
        changeType: "field_removed",
        severity: "breaking",
        oldValue: old.type,
        confidence: "deterministic",
        category: categoryFor("field_removed"),
      });
    }
  }

  // Added fields
  for (const [path, nw] of newMap) {
    if (!oldMap.has(path)) {
      diffs.push({
        field: path,
        changeType: "field_added",
        severity: "safe",
        newValue: nw.type,
        confidence: "deterministic",
        category: categoryFor("field_added"),
      });
    }
  }

  // Changed fields
  for (const [path, old] of oldMap) {
    const nw = newMap.get(path);
    if (!nw) continue;

    if (old.type !== nw.type) {
      const sev = scoreSeverity("type_change", old.type, nw.type);
      diffs.push({
        field: path,
        changeType: "type_change",
        severity: sev,
        oldValue: old.type,
        newValue: nw.type,
        confidence: "deterministic",
        category: categoryFor("type_change"),
      });
    }

    if (old.nullable !== nw.nullable) {
      const sev = scoreSeverity(
        "nullability_change",
        old.nullable ? "nullable" : "not-null",
        nw.nullable ? "nullable" : "not-null"
      );
      diffs.push({
        field: path,
        changeType: "nullability_change",
        severity: sev,
        oldValue: old.nullable ? "nullable" : "not-null",
        newValue: nw.nullable ? "nullable" : "not-null",
        confidence: "deterministic",
        category: categoryFor("nullability_change"),
      });
    }

    if (old.hasDefault !== nw.hasDefault || String(old.defaultValue) !== String(nw.defaultValue)) {
      diffs.push({
        field: path,
        changeType: "default_change",
        severity: "warning",
        oldValue: old.hasDefault ? String(old.defaultValue) : "none",
        newValue: nw.hasDefault ? String(nw.defaultValue) : "none",
        confidence: "deterministic",
        category: categoryFor("default_change"),
      });
    }
  }

  return diffs;
}
