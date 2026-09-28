import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityBadge } from "@/components/ActivityBadge";
import { secondaryButtonClass } from "@/components/form";
import { requireAdmin } from "@/lib/admin/auth";
import { recordToValues } from "@/lib/admin/forms";
import { prisma } from "@/lib/db";
import { formatMeasurement } from "@/lib/format";
import { getParam } from "@/lib/search-params";
import { deleteCompoundAction, saveCompoundAction } from "../../actions";
import { AdminNav, AdminTitle, ExampleBadge, Notice } from "../../_components/AdminNav";
import { DeleteButton } from "../../_components/DeleteButton";
import { RecordForm } from "../../_components/RecordForm";

export const metadata: Metadata = { title: "Edit compound" };

export default async function EditCompoundPage(props: PageProps<"/admin/compounds/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const params = await props.searchParams;
  const compound = await prisma.compound.findUnique({
    where: { id },
    include: { assays: { orderBy: [{ assayType: "asc" }, { createdAt: "asc" }] } },
  });
  if (!compound) notFound();
  const saved = getParam(params, "saved");
  const deleted = getParam(params, "deleted");

  return (
    <>
      <AdminNav current="/admin/compounds" />
      <AdminTitle
        title={`Edit ${compound.code}`}
        description={
          <>
            {compound.name} {compound.isExample ? <ExampleBadge /> : null}
          </>
        }
      >
        <Link href={`/compounds/${compound.id}`} className={secondaryButtonClass}>
          View public page
        </Link>
      </AdminTitle>
      {saved === "1" ? <Notice>Compound saved. Public pages are updated.</Notice> : null}
      {saved === "assay" ? <Notice>Assay result saved.</Notice> : null}
      {deleted === "assay" ? <Notice tone="orange">Assay result deleted.</Notice> : null}

      <RecordForm
        kind="Compounds"
        action={saveCompoundAction}
        id={compound.id}
        initialValues={recordToValues("Compounds", compound as unknown as Record<string, unknown>)}
        submitLabel="Save changes"
        cancelHref="/admin/compounds"
      />

      <section className="card p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-navy">Assay results ({compound.assays.length})</h2>
          <Link href={`/admin/assays/new?compound=${encodeURIComponent(compound.code)}`} className={secondaryButtonClass}>
            Add assay result
          </Link>
        </div>
        {compound.assays.length ? (
          <ul className="mt-4 divide-y divide-blush-300/50">
            {compound.assays.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-navy">{a.assayType}</span>
                  <span className="text-navy-muted">{[a.target, a.organism].filter(Boolean).join(" · ") || "—"}</span>
                  <span className="tabular-nums text-navy-muted">{formatMeasurement(a)}</span>
                  <ActivityBadge label={a.activityLabel} />
                  {a.isExample ? <ExampleBadge /> : null}
                </span>
                <Link href={`/admin/assays/${a.id}`} className="font-semibold text-teal-800 hover:text-orange-800">
                  Edit →
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-navy-muted">No assay results yet.</p>
        )}
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 border-orange/30 p-5 sm:p-7">
        <div>
          <h2 className="text-lg font-bold text-navy">Delete compound</h2>
          <p className="text-sm text-navy-muted">Permanently removes {compound.code} and its {compound.assays.length} assay result(s).</p>
        </div>
        <DeleteButton
          action={deleteCompoundAction}
          id={compound.id}
          label="Delete compound"
          confirmText={`Delete ${compound.code} and its ${compound.assays.length} assay result(s)? This cannot be undone.`}
        />
      </section>
    </>
  );
}
