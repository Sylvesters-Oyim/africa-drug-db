/**
 * Pure row validation for compound/assay imports (no database access).
 * Row numbers refer to the spreadsheet row (the header is row 1).
 */
import { DISEASES } from "../diseases";
import { ASSAY_COLUMNS, COMPOUND_COLUMNS, type ColumnDef, normalizeHeader } from "./columns";

export type SheetKind = "Compounds" | "Assays";

export type RawRow = { rowNumber: number; values: Record<string, unknown> };
export type RawTable = { headers: string[]; rows: RawRow[]; label?: string };

export type RowError = { sheet: SheetKind; rowNumber: number; column?: string; message: string };

export type ParsedRow = {
  rowNumber: number;
  /** Field name -> coerced value (null for empty cells). Only present columns are included. */
  data: Record<string, unknown>;
};

export type ValidatedTable = {
  kind: SheetKind;
  rows: ParsedRow[];
  /** Field names whose column exists in the file (only these are written on update). */
  presentFields: Set<string>;
  errors: RowError[];
  warnings: string[];
};

const CODE_RE = /^[A-Z0-9][A-Z0-9._-]{0,63}$/;
const INCHIKEY_RE = /^[A-Z]{14}-[A-Z]{10}-[A-Z]$/;
const DOI_RE = /^10\.\d{4,9}\/\S+$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

type Coerced = { ok: true; value: unknown } | { ok: false; message: string };

function toText(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

/** Excel serial date (days since 1899-12-30) to a UTC Date. */
function excelSerialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

export function coerceValue(col: ColumnDef, raw: unknown): Coerced {
  if (isBlank(raw)) {
    if (col.required) return { ok: false, message: `"${col.header}" is required` };
    if (col.kind === "boolean") return { ok: true, value: false };
    if (col.kind === "tags") return { ok: true, value: [] };
    return { ok: true, value: null };
  }

  switch (col.kind) {
    case "text":
      return { ok: true, value: toText(raw) };

    case "code": {
      const v = toText(raw).toUpperCase();
      if (!CODE_RE.test(v)) {
        return { ok: false, message: `"${col.header}" must use letters, digits, "-", "_" or "." (got "${toText(raw)}")` };
      }
      return { ok: true, value: v };
    }

    case "enum": {
      let v = toText(raw);
      if (col.field === "relation") {
        v = v.replace("≤", "<=").replace("≥", ">=").replace(/^==$/, "=");
      } else {
        v = v.toUpperCase().replace(/[\s-]+/g, "_");
      }
      if (!col.allowed?.includes(v)) {
        return { ok: false, message: `"${col.header}" must be one of ${col.allowed?.join(", ")} (got "${toText(raw)}")` };
      }
      return { ok: true, value: v };
    }

    case "number": {
      if (typeof raw === "number") {
        return Number.isFinite(raw) ? { ok: true, value: raw } : { ok: false, message: `"${col.header}" is not a finite number` };
      }
      const s = toText(raw).replace(/\s+/g, "");
      if (/^-?\d+,\d+$/.test(s)) {
        return { ok: false, message: `"${col.header}" uses a comma as decimal separator; use a dot (got "${s}")` };
      }
      const n = Number(s);
      if (s === "" || !Number.isFinite(n)) return { ok: false, message: `"${col.header}" must be a number (got "${toText(raw)}")` };
      return { ok: true, value: n };
    }

    case "date": {
      let d: Date | null = null;
      if (raw instanceof Date) {
        d = new Date(Date.UTC(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate()));
      } else if (typeof raw === "number") {
        const x = excelSerialToDate(raw);
        d = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
      } else {
        const m = DATE_RE.exec(toText(raw));
        if (m) {
          const [y, mo, da] = [Number(m[1]), Number(m[2]), Number(m[3])];
          const candidate = new Date(Date.UTC(y, mo - 1, da));
          if (candidate.getUTCFullYear() === y && candidate.getUTCMonth() === mo - 1 && candidate.getUTCDate() === da) {
            d = candidate;
          }
        }
      }
      if (!d || Number.isNaN(d.getTime())) {
        return { ok: false, message: `"${col.header}" must be a date as YYYY-MM-DD (got "${toText(raw)}")` };
      }
      if (d.getUTCFullYear() < 1800 || d.getTime() > Date.now() + 86400000) {
        return { ok: false, message: `"${col.header}" is out of range (got "${d.toISOString().slice(0, 10)}")` };
      }
      return { ok: true, value: d };
    }

    case "boolean": {
      if (typeof raw === "boolean") return { ok: true, value: raw };
      const v = toText(raw).toLowerCase();
      if (["true", "yes", "y", "1"].includes(v)) return { ok: true, value: true };
      if (["false", "no", "n", "0"].includes(v)) return { ok: true, value: false };
      return { ok: false, message: `"${col.header}" must be TRUE or FALSE (got "${toText(raw)}")` };
    }

    case "url": {
      const v = toText(raw);
      try {
        const u = new URL(v);
        if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad protocol");
        return { ok: true, value: v };
      } catch {
        return { ok: false, message: `"${col.header}" must be a full http(s) URL (got "${v}")` };
      }
    }

    case "doi": {
      const v = toText(raw)
        .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
        .replace(/^doi:\s*/i, "");
      if (!DOI_RE.test(v)) return { ok: false, message: `"${col.header}" must look like 10.xxxx/yyyy (got "${toText(raw)}")` };
      return { ok: true, value: v };
    }

    case "inchikey": {
      const v = toText(raw).toUpperCase();
      if (!INCHIKEY_RE.test(v)) {
        return { ok: false, message: `"${col.header}" must be a 27-character standard InChIKey (got "${toText(raw)}")` };
      }
      return { ok: true, value: v };
    }

    case "tags": {
      const parts = toText(raw)
        .split(/[;,|]/)
        .map((p) => p.trim())
        .filter(Boolean);
      const tags: string[] = [];
      const unknown: string[] = [];
      for (const p of parts) {
        const match = DISEASES.find((d) => d.tag === p.toLowerCase() || d.label.toLowerCase() === p.toLowerCase());
        if (match) {
          if (!tags.includes(match.tag)) tags.push(match.tag);
        } else unknown.push(p);
      }
      if (unknown.length) {
        return {
          ok: false,
          message: `Unknown disease tag(s): ${unknown.join(", ")}. Allowed: ${DISEASES.map((d) => d.tag).join(", ")}`,
        };
      }
      return { ok: true, value: tags };
    }
  }
}

function rowIsEmpty(row: RawRow): boolean {
  return Object.values(row.values).every(isBlank);
}

/** Validate a raw table against the compound or assay column definitions. */
export function validateTable(kind: SheetKind, table: RawTable): ValidatedTable {
  const columns = kind === "Compounds" ? COMPOUND_COLUMNS : ASSAY_COLUMNS;
  const errors: RowError[] = [];
  const warnings: string[] = [];

  const byNorm = new Map(columns.map((c) => [normalizeHeader(c.header), c] as const));
  // Also accept the camelCase field names as headers.
  for (const c of columns) byNorm.set(normalizeHeader(c.field), c);

  const headerToCol = new Map<string, ColumnDef>();
  const seen = new Set<string>();
  for (const h of table.headers) {
    const n = normalizeHeader(h);
    if (!n) continue;
    const col = byNorm.get(n);
    if (!col) {
      warnings.push(`${kind}: ignored unknown column "${h}"`);
      continue;
    }
    if (seen.has(col.field)) {
      errors.push({ sheet: kind, rowNumber: 1, column: h, message: `Duplicate column "${h}"` });
      continue;
    }
    seen.add(col.field);
    headerToCol.set(n, col);
  }

  for (const col of columns) {
    if (col.required && !seen.has(col.field)) {
      errors.push({ sheet: kind, rowNumber: 1, column: col.header, message: `Missing required column "${col.header}"` });
    }
  }

  const rows: ParsedRow[] = [];
  if (errors.length) return { kind, rows, presentFields: seen, errors, warnings };

  const presentCols = columns.filter((c) => seen.has(c.field));
  const firstRowFor = new Map<string, number>();

  for (const raw of table.rows) {
    if (rowIsEmpty(raw)) continue;
    const normValues = new Map<string, unknown>();
    for (const [h, v] of Object.entries(raw.values)) normValues.set(normalizeHeader(h), v);

    const data: Record<string, unknown> = {};
    let rowOk = true;
    for (const col of presentCols) {
      const rawValue = normValues.get(normalizeHeader(col.header)) ?? normValues.get(normalizeHeader(col.field));
      const result = coerceValue(col, rawValue);
      if (result.ok) data[col.field] = result.value;
      else {
        rowOk = false;
        errors.push({ sheet: kind, rowNumber: raw.rowNumber, column: col.header, message: result.message });
      }
    }

    if (kind === "Assays") {
      // Only when the value is genuinely empty (not when it failed to parse).
      if (data.relation && (data.resultValue === null || (!seen.has("resultValue") && data.resultValue === undefined))) {
        rowOk = false;
        errors.push({ sheet: kind, rowNumber: raw.rowNumber, column: "relation", message: '"relation" requires a "value"' });
      }
      if (seen.has("relation") && !data.relation && typeof data.resultValue === "number") data.relation = "=";
    }

    if (!rowOk) continue;

    const key = kind === "Compounds" ? String(data.code) : assayNaturalKey(String(data.compoundCode), data);
    const prev = firstRowFor.get(key);
    if (prev !== undefined) {
      errors.push({
        sheet: kind,
        rowNumber: raw.rowNumber,
        message:
          kind === "Compounds"
            ? `Duplicate compound code "${String(data.code)}" (first seen on row ${prev})`
            : `Duplicate assay (same de-duplication key as row ${prev})`,
      });
      continue;
    }
    firstRowFor.set(key, raw.rowNumber);
    rows.push({ rowNumber: raw.rowNumber, data });
  }

  return { kind, rows, presentFields: seen, errors, warnings };
}

function norm(v: unknown): string {
  return v === null || v === undefined ? "" : String(v).trim().toLowerCase();
}

/**
 * De-duplication key for assays.
 * - With a source record id (e.g. a ChEMBL activity ID): compound code + source record id.
 * - Without one: compound code + assay type + target + organism + measurement type + source name + DOI.
 */
export function assayNaturalKey(compoundCode: string, a: Record<string, unknown>): string {
  const rid = norm(a.sourceRecordId);
  if (rid) return `rid|${compoundCode.toUpperCase()}|${rid}`;
  return [
    "nat",
    compoundCode.toUpperCase(),
    norm(a.assayType),
    norm(a.target),
    norm(a.organism),
    norm(a.measurementType),
    norm(a.sourceName),
    norm(a.doi),
  ].join("|");
}
