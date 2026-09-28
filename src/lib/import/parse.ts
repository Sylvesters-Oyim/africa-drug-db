/**
 * Parse uploaded CSV / XLSX files into raw tables for validation.
 */
import { parse as parseCsvSync } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { normalizeHeader } from "./columns";
import type { RawRow, RawTable, SheetKind } from "./validate";

export type ImportFile = { name: string; data: Buffer | Uint8Array };

export type LoadedTables = {
  compounds?: RawTable;
  assays?: RawTable;
  /** File-level problems (unreadable file, unknown table type, ...). */
  fileErrors: string[];
};

export const MAX_IMPORT_ROWS = 20000;

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const counts = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length - 1] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
}

export function parseCsv(input: string | Buffer | Uint8Array): RawTable {
  const text = typeof input === "string" ? input : Buffer.from(input).toString("utf8");
  const records = parseCsvSync(text, {
    bom: true,
    delimiter: detectDelimiter(text.replace(/^\uFEFF/, "")),
    relax_column_count: true,
    relax_quotes: true,
    skip_empty_lines: false,
  }) as string[][];
  if (records.length === 0) return { headers: [], rows: [] };
  const headers = records[0].map((h) => h.trim());
  const rows: RawRow[] = [];
  for (let i = 1; i < records.length; i++) {
    const values: Record<string, unknown> = {};
    headers.forEach((h, j) => {
      if (h) values[h] = records[i][j] ?? "";
    });
    rows.push({ rowNumber: i + 1, values });
  }
  return { headers, rows };
}

function cellToPrimitive(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((r) => r.text).join("");
    if ("formula" in value || "sharedFormula" in value) {
      const result = (value as ExcelJS.CellFormulaValue).result;
      return result instanceof Date || typeof result !== "object" ? (result ?? null) : null;
    }
    if ("text" in value && typeof (value as { text: unknown }).text === "string") return (value as { text: string }).text;
    if ("error" in value) return String((value as ExcelJS.CellErrorValue).error);
    return null;
  }
  return value;
}

function worksheetToTable(ws: ExcelJS.Worksheet): RawTable {
  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    const v = cellToPrimitive(cell.value);
    headers[col - 1] = v === null ? "" : String(v).trim();
  });
  const rows: RawRow[] = [];
  const last = ws.actualRowCount > 0 ? ws.rowCount : 0;
  for (let r = 2; r <= last; r++) {
    const row = ws.getRow(r);
    const values: Record<string, unknown> = {};
    headers.forEach((h, j) => {
      if (h) values[h] = cellToPrimitive(row.getCell(j + 1).value);
    });
    rows.push({ rowNumber: r, values });
  }
  return { headers: headers.map((h) => h ?? ""), rows };
}

export async function parseXlsx(data: Buffer | Uint8Array): Promise<{ compounds?: RawTable; assays?: RawTable }> {
  const wb = new ExcelJS.Workbook();
  // exceljs' type wants a Node Buffer.
  await wb.xlsx.load(Buffer.from(data) as unknown as ArrayBuffer);
  const out: { compounds?: RawTable; assays?: RawTable } = {};
  wb.eachSheet((ws) => {
    const name = ws.name.trim().toLowerCase();
    if (name === "compounds") out.compounds = worksheetToTable(ws);
    else if (name === "assays") out.assays = worksheetToTable(ws);
  });
  return out;
}

/** Decide whether a CSV holds compounds or assays from its header row. */
export function detectKind(headers: string[], fileName = ""): SheetKind | null {
  const n = new Set(headers.map(normalizeHeader));
  if (n.has("compoundcode")) return "Assays";
  if (n.has("code") && n.has("name")) return "Compounds";
  const f = fileName.toLowerCase();
  if (f.includes("assay")) return "Assays";
  if (f.includes("compound")) return "Compounds";
  return null;
}

/** Load any mix of CSV/XLSX files into at most one compounds and one assays table. */
export async function loadImportFiles(files: ImportFile[]): Promise<LoadedTables> {
  const out: LoadedTables = { fileErrors: [] };

  const assign = (kind: SheetKind, table: RawTable, source: string) => {
    const slot = kind === "Compounds" ? "compounds" : "assays";
    if (out[slot]) {
      out.fileErrors.push(`More than one ${kind.toLowerCase()} table supplied (${source}); upload one per type.`);
      return;
    }
    if (table.rows.length > MAX_IMPORT_ROWS) {
      out.fileErrors.push(`${source}: too many rows (${table.rows.length}); the limit is ${MAX_IMPORT_ROWS} per table.`);
      return;
    }
    out[slot] = { ...table, label: source };
  };

  for (const file of files) {
    const lower = file.name.toLowerCase();
    try {
      if (lower.endsWith(".xlsx")) {
        const { compounds, assays } = await parseXlsx(file.data);
        if (!compounds && !assays) {
          out.fileErrors.push(`${file.name}: no sheet named "Compounds" or "Assays" found.`);
        }
        if (compounds) assign("Compounds", compounds, `${file.name} › Compounds`);
        if (assays) assign("Assays", assays, `${file.name} › Assays`);
      } else if (lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.endsWith(".txt")) {
        const table = parseCsv(file.data);
        const kind = detectKind(table.headers, file.name);
        if (!kind) {
          out.fileErrors.push(
            `${file.name}: could not tell whether this is a compounds or assays file (expected a "code"+"name" or "compound_code" column).`,
          );
        } else assign(kind, table, file.name);
      } else if (lower.endsWith(".xls")) {
        out.fileErrors.push(`${file.name}: legacy .xls is not supported; save as .xlsx or .csv.`);
      } else {
        out.fileErrors.push(`${file.name}: unsupported file type (use .csv or .xlsx).`);
      }
    } catch (e) {
      out.fileErrors.push(`${file.name}: could not be read (${e instanceof Error ? e.message : String(e)}).`);
    }
  }
  return out;
}
