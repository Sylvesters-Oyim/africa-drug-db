/**
 * Helpers shared by the admin add/edit forms. Form inputs are named after the
 * template column headers, so single-record edits go through exactly the same
 * validation as spreadsheet imports.
 */
import { ASSAY_COLUMNS, COMPOUND_COLUMNS, type ColumnDef } from "../import/columns";
import { type SheetKind, validateTable } from "../import/validate";

export type FormValues = Record<string, string>;
export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: FormValues;
};

function columnsFor(kind: SheetKind): ColumnDef[] {
  return kind === "Compounds" ? COMPOUND_COLUMNS : ASSAY_COLUMNS;
}

export function formDataToValues(kind: SheetKind, formData: FormData): FormValues {
  const values: FormValues = {};
  for (const col of columnsFor(kind)) {
    if (col.kind === "tags") values[col.header] = formData.getAll(col.header).map(String).join(";");
    else if (col.kind === "boolean") values[col.header] = formData.get(col.header) ? "TRUE" : "FALSE";
    else values[col.header] = String(formData.get(col.header) ?? "");
  }
  return values;
}

export function validateFormValues(kind: SheetKind, values: FormValues) {
  const cols = columnsFor(kind);
  const table = validateTable(kind, { headers: cols.map((c) => c.header), rows: [{ rowNumber: 1, values }] });
  const fieldErrors: Record<string, string> = {};
  for (const e of table.errors) fieldErrors[e.column ?? "_form"] = e.message;
  const data = table.rows[0]?.data;
  if (!data && !Object.keys(fieldErrors).length) fieldErrors._form = "The form is empty.";
  return { data, fieldErrors };
}

/** Convert a database record into string form values keyed by column header. */
export function recordToValues(kind: SheetKind, record: Record<string, unknown>): FormValues {
  const values: FormValues = {};
  for (const col of columnsFor(kind)) {
    const v = record[col.field];
    if (v === null || v === undefined) values[col.header] = "";
    else if (v instanceof Date) values[col.header] = v.toISOString().slice(0, 10);
    else if (Array.isArray(v)) values[col.header] = v.join(";");
    else if (typeof v === "boolean") values[col.header] = v ? "TRUE" : "FALSE";
    else values[col.header] = String(v);
  }
  return values;
}
