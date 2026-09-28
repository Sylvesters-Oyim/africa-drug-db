/**
 * Plan and (optionally) apply an import.
 *
 * - Compounds are upserted by `code`.
 * - Assays are matched by `assayNaturalKey` (compound code + source record id,
 *   or compound + assay type + target + organism + measurement type + source + DOI).
 * - Only columns present in the file are written on update; unchanged rows are skipped.
 * - A dry run only reads. A real import runs inside one transaction and is
 *   all-or-nothing: any validation error means nothing is written.
 */
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { loadImportFiles, type ImportFile, type LoadedTables } from "./parse";
import { assayNaturalKey, type RowError, type ValidatedTable, validateTable } from "./validate";

type Db = Pick<PrismaClient, "compound" | "assay">;

export type Counts = { create: number; update: number; unchanged: number };

export type ImportResult = {
  dryRun: boolean;
  /** True when the data was written (never for dry runs or when there are errors). */
  committed: boolean;
  compounds: Counts;
  assays: Counts;
  errors: RowError[];
  fileErrors: string[];
  warnings: string[];
  sources: string[];
};

type CompoundOp = { kind: "create" | "update"; rowNumber: number; id?: string; data: Record<string, unknown> };
type AssayOp = { kind: "create" | "update"; rowNumber: number; id?: string; compoundCode: string; data: Record<string, unknown> };

const COMPOUND_FIELDS_EXCLUDED = new Set<string>();
const ASSAY_FIELDS_EXCLUDED = new Set(["compoundCode"]);

function sameValue(a: unknown, b: unknown): boolean {
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i]);
  }
  return (a ?? null) === (b ?? null);
}

function changedFields(existing: Record<string, unknown>, incoming: Record<string, unknown>, excluded: Set<string>) {
  const diff: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(incoming)) {
    if (excluded.has(k)) continue;
    if (!sameValue(existing[k], v)) diff[k] = v;
  }
  return diff;
}

function emptyCounts(): Counts {
  return { create: 0, update: 0, unchanged: 0 };
}

async function plan(db: Db, tables: LoadedTables) {
  const errors: RowError[] = [];
  const warnings: string[] = [];
  const compoundsCounts = emptyCounts();
  const assaysCounts = emptyCounts();
  const compoundOps: CompoundOp[] = [];
  const assayOps: AssayOp[] = [];

  let vc: ValidatedTable | undefined;
  let va: ValidatedTable | undefined;
  if (tables.compounds) {
    vc = validateTable("Compounds", tables.compounds);
    errors.push(...vc.errors);
    warnings.push(...vc.warnings);
  }
  if (tables.assays) {
    va = validateTable("Assays", tables.assays);
    errors.push(...va.errors);
    warnings.push(...va.warnings);
  }

  const fileCodes = new Set((vc?.rows ?? []).map((r) => String(r.data.code)));
  const referencedCodes = new Set<string>([...fileCodes, ...(va?.rows ?? []).map((r) => String(r.data.compoundCode))]);

  const existingCompounds = referencedCodes.size
    ? await db.compound.findMany({ where: { code: { in: [...referencedCodes] } } })
    : [];
  const compoundByCode = new Map(existingCompounds.map((c) => [c.code, c]));

  // Compounds
  for (const row of vc?.rows ?? []) {
    const code = String(row.data.code);
    const existing = compoundByCode.get(code);
    if (!existing) {
      compoundOps.push({ kind: "create", rowNumber: row.rowNumber, data: row.data });
      compoundsCounts.create++;
    } else {
      const diff = changedFields(existing as unknown as Record<string, unknown>, row.data, COMPOUND_FIELDS_EXCLUDED);
      if (Object.keys(diff).length) {
        compoundOps.push({ kind: "update", rowNumber: row.rowNumber, id: existing.id, data: diff });
        compoundsCounts.update++;
      } else compoundsCounts.unchanged++;
    }
  }

  // Assays
  if (va && va.rows.length) {
    const existingIds = [...compoundByCode.values()].map((c) => c.id);
    const codeById = new Map([...compoundByCode.values()].map((c) => [c.id, c.code]));
    const existingAssays = existingIds.length
      ? await db.assay.findMany({ where: { compoundId: { in: existingIds } }, orderBy: { createdAt: "asc" } })
      : [];
    const assayByKey = new Map<string, (typeof existingAssays)[number]>();
    for (const a of existingAssays) {
      const key = assayNaturalKey(codeById.get(a.compoundId) ?? "", a as unknown as Record<string, unknown>);
      if (!assayByKey.has(key)) assayByKey.set(key, a);
    }

    for (const row of va.rows) {
      const code = String(row.data.compoundCode);
      if (!compoundByCode.has(code) && !fileCodes.has(code)) {
        errors.push({
          sheet: "Assays",
          rowNumber: row.rowNumber,
          column: "compound_code",
          message: `Unknown compound code "${code}" (not in the database or the compounds file)`,
        });
        continue;
      }
      const existing = assayByKey.get(assayNaturalKey(code, row.data));
      if (!existing) {
        assayOps.push({ kind: "create", rowNumber: row.rowNumber, compoundCode: code, data: row.data });
        assaysCounts.create++;
      } else {
        const diff = changedFields(existing as unknown as Record<string, unknown>, row.data, ASSAY_FIELDS_EXCLUDED);
        if (Object.keys(diff).length) {
          assayOps.push({ kind: "update", rowNumber: row.rowNumber, id: existing.id, compoundCode: code, data: diff });
          assaysCounts.update++;
        } else assaysCounts.unchanged++;
      }
    }
  }

  errors.sort((a, b) => (a.sheet === b.sheet ? a.rowNumber - b.rowNumber : a.sheet === "Compounds" ? -1 : 1));
  return { errors, warnings, compoundsCounts, assaysCounts, compoundOps, assayOps };
}

async function apply(tx: Prisma.TransactionClient, compoundOps: CompoundOp[], assayOps: AssayOp[]) {
  const creates = compoundOps.filter((o) => o.kind === "create");
  if (creates.length) {
    await tx.compound.createMany({ data: creates.map((o) => o.data as unknown as Prisma.CompoundCreateManyInput) });
  }
  for (const op of compoundOps.filter((o) => o.kind === "update")) {
    await tx.compound.update({ where: { id: op.id }, data: op.data as Prisma.CompoundUpdateInput });
  }

  if (!assayOps.length) return;
  const codes = [...new Set(assayOps.map((o) => o.compoundCode))];
  const ids = await tx.compound.findMany({ where: { code: { in: codes } }, select: { id: true, code: true } });
  const idByCode = new Map(ids.map((c) => [c.code, c.id]));

  const assayCreates = assayOps
    .filter((o) => o.kind === "create")
    .map((o) => {
      const { compoundCode: _omit, ...rest } = o.data;
      void _omit;
      const compoundId = idByCode.get(o.compoundCode);
      if (!compoundId) throw new Error(`Compound ${o.compoundCode} vanished during import`);
      return { ...rest, compoundId } as unknown as Prisma.AssayCreateManyInput;
    });
  if (assayCreates.length) await tx.assay.createMany({ data: assayCreates });

  for (const op of assayOps.filter((o) => o.kind === "update")) {
    await tx.assay.update({ where: { id: op.id }, data: op.data as Prisma.AssayUpdateInput });
  }
}

class RollbackSignal extends Error {}

/** Parse, validate, plan and (unless dryRun) apply an import of the given files. */
export async function runImport(
  prisma: PrismaClient,
  files: ImportFile[],
  options: { dryRun: boolean },
): Promise<ImportResult> {
  const tables = await loadImportFiles(files);
  const sources = [tables.compounds?.label, tables.assays?.label].filter((s): s is string => Boolean(s));
  const base = { dryRun: options.dryRun, fileErrors: tables.fileErrors, sources };

  if (!tables.compounds && !tables.assays && tables.fileErrors.length === 0) {
    tables.fileErrors.push("No compounds or assays table found in the uploaded file(s).");
  }

  if (options.dryRun || tables.fileErrors.length) {
    const p = await plan(prisma, tables);
    return {
      ...base,
      committed: false,
      compounds: p.compoundsCounts,
      assays: p.assaysCounts,
      errors: p.errors,
      warnings: p.warnings,
    };
  }

  let result: ImportResult | undefined;
  try {
    await prisma.$transaction(
      async (tx) => {
        const p = await plan(tx, tables);
        result = {
          ...base,
          committed: false,
          compounds: p.compoundsCounts,
          assays: p.assaysCounts,
          errors: p.errors,
          warnings: p.warnings,
        };
        if (p.errors.length) throw new RollbackSignal();
        await apply(tx, p.compoundOps, p.assayOps);
        result.committed = true;
      },
      { maxWait: 15_000, timeout: 180_000 },
    );
  } catch (e) {
    if (!(e instanceof RollbackSignal)) throw e;
  }
  return result!;
}

/** Plain-text summary used by the CLI. */
export function formatResult(r: ImportResult): string {
  const lines: string[] = [];
  lines.push(r.dryRun ? "DRY RUN (nothing written)" : r.committed ? "IMPORT COMMITTED" : "IMPORT ABORTED (nothing written)");
  if (r.sources.length) lines.push(`Sources: ${r.sources.join(", ")}`);
  const c = r.compounds;
  const a = r.assays;
  const [cr, up] = r.committed ? ["created", "updated"] : ["to create", "to update"];
  lines.push(`Compounds: ${c.create} ${cr}, ${c.update} ${up}, ${c.unchanged} unchanged`);
  lines.push(`Assays:    ${a.create} ${cr}, ${a.update} ${up}, ${a.unchanged} unchanged`);
  for (const w of r.warnings) lines.push(`warning: ${w}`);
  for (const f of r.fileErrors) lines.push(`error: ${f}`);
  for (const e of r.errors) lines.push(`error: ${e.sheet} row ${e.rowNumber}${e.column ? ` [${e.column}]` : ""}: ${e.message}`);
  return lines.join("\n");
}
