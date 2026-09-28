import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { secondaryButtonClass } from "@/components/form";
import { requireAdmin } from "@/lib/admin/auth";
import { recordToValues } from "@/lib/admin/forms";
import { prisma } from "@/lib/db";
import { deleteAssayAction, saveAssayAction } from "../../actions";
import { AdminNav, AdminTitle, ExampleBadge } from "../../_components/AdminNav";
import { DeleteButton } from "../../_components/DeleteButton";
import { RecordForm } from "../../_components/RecordForm";

export const metadata: Metadata = { title: "Edit assay result" };

export default async function EditAssayPage(props: PageProps<"/admin/assays/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const assay = await prisma.assay.findUnique({ where: { id }, include: { compound: { select: { id: true, code: true, name: true } } } });
  if (!assay) notFound();
  const codes = await prisma.compound.findMany({ select: { code: true }, orderBy: { code: "asc" }, take: 5000 });
  const values = recordToValues("Assays", { ...assay, compoundCode: assay.compound.code } as unknown as Record<string, unknown>);

  return (
    <>
      <AdminNav current="/admin/assays" />
      <AdminTitle
        title="Edit assay result"
        description={
          <>
            {assay.assayType} for {assay.compound.code} {assay.isExample ? <ExampleBadge /> : null}
          </>
        }
      >
        <Link href={`/admin/compounds/${assay.compound.id}`} className={secondaryButtonClass}>
          ← {assay.compound.code}
        </Link>
      </AdminTitle>
      <RecordForm
        kind="Assays"
        action={saveAssayAction}
        id={assay.id}
        initialValues={values}
        submitLabel="Save changes"
        cancelHref={`/admin/compounds/${assay.compound.id}`}
        compoundCodes={codes.map((c) => c.code)}
      />
      <section className="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-7">
        <div>
          <h2 className="text-lg font-bold text-navy">Delete assay result</h2>
          <p className="text-sm text-navy-muted">Permanently removes this result from {assay.compound.code}.</p>
        </div>
        <DeleteButton action={deleteAssayAction} id={assay.id} label="Delete result" confirmText="Delete this assay result? This cannot be undone." />
      </section>
    </>
  );
}
