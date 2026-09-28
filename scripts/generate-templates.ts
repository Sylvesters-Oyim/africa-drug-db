/**
 * Generate the import templates in public/templates/ from the column
 * definitions in src/lib/import/columns.ts.
 *
 *   npm run templates
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { ASSAY_COLUMNS, COMPOUND_COLUMNS, type ColumnDef } from "../src/lib/import/columns";

const OUT = join(process.cwd(), "public", "templates");

const exampleCompounds: Record<string, string>[] = [
  {
    code: "EXAMPLE-0001",
    name: "EXAMPLE ROW - replace with your data",
    source_region: "Kenya",
    country_of_origin: "Kenya",
    disease_tags: "malaria",
    source_notes: "Example row only: delete or replace before importing real data.",
    collection_date: "2024-03-15",
    abs_permit_ref: "ABSCH-IRCC-KE-000000-1 (example)",
    source_type: "LITERATURE",
    source_name: "Example Journal of Natural Products",
    source_url: "https://example.org/articles/example-0001",
    doi: "10.1234/example.0001",
    citation: "Example A, Example B. An example isolation study. Example J Nat Prod. 2024;1:1-10.",
    license: "CC BY 4.0",
    is_example: "TRUE",
  },
  {
    code: "EXAMPLE-0002",
    name: "EXAMPLE ROW - database-sourced compound",
    source_region: "West Africa",
    country_of_origin: "Ghana",
    disease_tags: "tuberculosis; buruli-ulcer",
    source_type: "DATABASE",
    source_name: "ChEMBL 35",
    source_url: "https://www.ebi.ac.uk/chembl/",
    license: "CC BY-SA 3.0",
    source_record_id: "CHEMBL-EXAMPLE-0002",
    is_example: "TRUE",
  },
];

const exampleAssays: Record<string, string>[] = [
  {
    compound_code: "EXAMPLE-0001",
    assay_type: "In vitro growth inhibition",
    activity: "ACTIVE",
    measurement_type: "IC50",
    relation: "=",
    value: "0.42",
    units: "µM",
    organism: "Plasmodium falciparum 3D7",
    performed_in_country: "Kenya",
    source_type: "LITERATURE",
    source_name: "Example Journal of Natural Products",
    doi: "10.1234/example.0001",
    license: "CC BY 4.0",
    is_example: "TRUE",
  },
  {
    compound_code: "EXAMPLE-0002",
    assay_type: "Cytotoxicity",
    activity: "INACTIVE",
    measurement_type: "CC50",
    relation: ">",
    value: "100",
    units: "µM",
    target: "HepG2 cells",
    source_type: "DATABASE",
    source_name: "ChEMBL 35",
    license: "CC BY-SA 3.0",
    source_record_id: "CHEMBL-ACT-EXAMPLE-0002",
    is_example: "TRUE",
  },
];

function csvEscape(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function toCsv(columns: ColumnDef[], rows: Record<string, string>[]): string {
  const lines = [columns.map((c) => c.header).join(",")];
  for (const r of rows) lines.push(columns.map((c) => csvEscape(r[c.header] ?? "")).join(","));
  // BOM so Excel opens UTF-8 (µ, accents) correctly.
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

const NAVY = "FF25244C";
const ORANGE = "FFF7A13A";
const CREAM = "FFFBEAE2";
const MINT = "FFA4D09F";

function addDataSheet(wb: ExcelJS.Workbook, name: string, columns: ColumnDef[], rows: Record<string, string>[]) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = columns.map((c) => ({ header: c.header, key: c.header, width: Math.max(14, Math.min(40, c.header.length + 6)) }));
  const header = ws.getRow(1);
  header.eachCell((cell, i) => {
    const col = columns[i - 1];
    cell.font = { bold: true, color: { argb: col.required ? NAVY : "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: col.required ? ORANGE : NAVY } };
    cell.note = `${col.required ? "REQUIRED. " : "Optional. "}${col.description}${col.allowed ? `\nAllowed: ${col.allowed.join(", ")}` : ""}`;
  });
  for (const r of rows) {
    const values: Record<string, string | number> = {};
    for (const c of columns) {
      const v = r[c.header];
      if (v === undefined) continue;
      values[c.header] = c.kind === "number" && v !== "" ? Number(v) : v;
    }
    const row = ws.addRow(values);
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };
      cell.font = { italic: true, color: { argb: "FF5B5A7E" } };
    });
  }
  // Dropdowns for enum/boolean columns on the first 2000 data rows.
  columns.forEach((c, i) => {
    if (!c.allowed || c.kind === "tags") return;
    const letter = ws.getColumn(i + 1).letter;
    for (let r = 2; r <= 2000; r++) {
      ws.getCell(`${letter}${r}`).dataValidation = {
        type: "list",
        allowBlank: !c.required,
        formulae: [`"${c.allowed.join(",")}"`],
        showErrorMessage: true,
        errorTitle: `Invalid ${c.header}`,
        error: `Allowed: ${c.allowed.join(", ")}`,
      };
    }
  });
  return ws;
}

function addInstructions(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("Instructions");
  ws.columns = [
    { header: "Sheet", key: "sheet", width: 12 },
    { header: "Column", key: "column", width: 22 },
    { header: "Required", key: "required", width: 10 },
    { header: "Type", key: "type", width: 10 },
    { header: "Allowed values", key: "allowed", width: 36 },
    { header: "Description", key: "description", width: 90 },
  ];
  const intro = [
    "Africa Drug Discovery DB: import template",
    "1. Fill in the Compounds sheet (one row per compound) and the Assays sheet (one row per result). Orange headers are required.",
    "2. Assays link to compounds by compound_code, which must match a code in the Compounds sheet or one already in the database.",
    "3. The shaded EXAMPLE rows are marked is_example = TRUE. Delete them (or leave them: they are flagged as example data).",
    "4. Re-importing is safe: compounds are matched by code, and assays by compound_code + source_record_id",
    "   (or, without a source_record_id, by compound_code + assay_type + target + organism + measurement_type + source_name + doi).",
    "   Matching rows are updated, and empty cells clear the stored value for that column.",
    "5. Always record provenance: source_type, source_name, licence (e.g. CC BY-SA 3.0 for ChEMBL), DOI/URL and any ABS permit reference.",
    "6. Upload at /admin/import (dry run first) or run: npm run import -- --file this-file.xlsx --dry-run",
    "",
  ];
  ws.spliceRows(1, 0, ...intro.map((t) => [t]));
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: NAVY } };
  const headerRowNumber = intro.length + 1;
  const hr = ws.getRow(headerRowNumber);
  hr.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });
  const add = (sheet: string, cols: ColumnDef[]) => {
    for (const c of cols) {
      const row = ws.addRow({
        sheet,
        column: c.header,
        required: c.required ? "Yes" : "No",
        type: c.kind === "code" ? "code" : c.kind,
        allowed: c.allowed ? c.allowed.join(", ") : "",
        description: c.description,
      });
      row.alignment = { vertical: "top", wrapText: true };
      if (c.required) row.getCell("required").fill = { type: "pattern", pattern: "solid", fgColor: { argb: MINT } };
    }
  };
  add("Compounds", COMPOUND_COLUMNS);
  add("Assays", ASSAY_COLUMNS);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, "compounds.csv"), toCsv(COMPOUND_COLUMNS, exampleCompounds));
  await writeFile(join(OUT, "assays.csv"), toCsv(ASSAY_COLUMNS, exampleAssays));

  const wb = new ExcelJS.Workbook();
  wb.creator = "Africa Drug Discovery DB";
  wb.created = new Date("2026-01-01T00:00:00Z");
  wb.modified = wb.created;
  addDataSheet(wb, "Compounds", COMPOUND_COLUMNS, exampleCompounds);
  addDataSheet(wb, "Assays", ASSAY_COLUMNS, exampleAssays);
  addInstructions(wb);
  await wb.xlsx.writeFile(join(OUT, "africa-drug-db-import-template.xlsx"));
  console.log(`Templates written to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
