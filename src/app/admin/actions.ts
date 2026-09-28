"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import {
  checkPassword,
  clearSessionCookie,
  clientKey,
  isAdminConfigured,
  penalizeFailure,
  requireAdmin,
  resetFailures,
  setSessionCookie,
} from "@/lib/admin/auth";
import { type FormState, formDataToValues, validateFormValues } from "@/lib/admin/forms";
import { prisma } from "@/lib/db";
import { type ImportFile, type ImportResult, runImport } from "@/lib/import";

// Every exported function in this file is a public endpoint: each one checks
// authorisation itself via requireAdmin() before touching data.

export async function loginAction(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  if (!isAdminConfigured()) return { error: "Admin is not configured." };
  const password = String(formData.get("password") ?? "");
  const key = await clientKey();
  if (!password || !checkPassword(password)) {
    await penalizeFailure(key);
    return { error: "Incorrect password." };
  }
  resetFailures(key);
  await setSessionCookie();
  redirect("/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}

function refreshPublicPages() {
  // Public pages are force-dynamic; this also clears client router caches.
  revalidatePath("/", "layout");
}

// --- Import --------------------------------------------------------------------

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export type ImportActionResult = { result?: ImportResult; error?: string };

export async function importAction(formData: FormData): Promise<ImportActionResult> {
  await requireAdmin();
  const dryRun = formData.get("mode") !== "commit";
  const files: ImportFile[] = [];
  for (const entry of formData.getAll("files")) {
    if (typeof entry === "string" || entry.size === 0) continue;
    if (entry.size > MAX_FILE_BYTES) return { error: `${entry.name} is larger than 4 MB; split it or use the CLI importer.` };
    files.push({ name: entry.name, data: Buffer.from(await entry.arrayBuffer()) });
  }
  if (!files.length) return { error: "Choose at least one CSV or XLSX file." };
  try {
    const result = await runImport(prisma, files, { dryRun });
    if (result.committed) refreshPublicPages();
    return { result };
  } catch (e) {
    console.error("Import failed", e);
    return { error: "The import failed unexpectedly; nothing was written. Check the server logs." };
  }
}

// --- Compounds -------------------------------------------------------------------

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002";
}

export async function saveCompoundAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "") || null;
  const values = formDataToValues("Compounds", formData);
  const { data, fieldErrors } = validateFormValues("Compounds", values);
  if (!data) return { fieldErrors, values, message: "Please fix the highlighted fields." };

  const clash = await prisma.compound.findUnique({ where: { code: String(data.code) }, select: { id: true } });
  if (clash && clash.id !== id) {
    return { fieldErrors: { code: `Code "${String(data.code)}" is already used by another compound.` }, values };
  }

  let savedId: string;
  try {
    if (id) {
      const updated = await prisma.compound.update({ where: { id }, data: data as Prisma.CompoundUpdateInput });
      savedId = updated.id;
    } else {
      const created = await prisma.compound.create({ data: data as unknown as Prisma.CompoundCreateInput });
      savedId = created.id;
    }
  } catch (e) {
    if (isUniqueViolation(e)) return { fieldErrors: { code: "That code is already in use." }, values };
    throw e;
  }
  refreshPublicPages();
  redirect(`/admin/compounds/${savedId}?saved=1`);
}

export async function deleteCompoundAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.compound.delete({ where: { id } }).catch(() => null);
  refreshPublicPages();
  redirect("/admin/compounds?deleted=1");
}

// --- Assays ----------------------------------------------------------------------

export async function saveAssayAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "") || null;
  const values = formDataToValues("Assays", formData);
  const { data, fieldErrors } = validateFormValues("Assays", values);
  if (!data) return { fieldErrors, values, message: "Please fix the highlighted fields." };

  const compound = await prisma.compound.findUnique({ where: { code: String(data.compoundCode) }, select: { id: true } });
  if (!compound) {
    return { fieldErrors: { compound_code: `No compound with code "${String(data.compoundCode)}".` }, values };
  }
  const { compoundCode: _code, ...rest } = data;
  void _code;
  const payload = { ...rest, compoundId: compound.id } as unknown as Prisma.AssayUncheckedCreateInput;

  if (id) await prisma.assay.update({ where: { id }, data: payload });
  else await prisma.assay.create({ data: payload });
  refreshPublicPages();
  redirect(`/admin/compounds/${compound.id}?saved=assay`);
}

export async function deleteAssayAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const assay = id ? await prisma.assay.findUnique({ where: { id }, select: { compoundId: true } }) : null;
  if (assay) await prisma.assay.delete({ where: { id } });
  refreshPublicPages();
  redirect(assay ? `/admin/compounds/${assay.compoundId}?deleted=assay` : "/admin/assays");
}
