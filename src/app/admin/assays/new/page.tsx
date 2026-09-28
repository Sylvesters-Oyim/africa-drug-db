import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { getParam } from "@/lib/search-params";
import { saveAssayAction } from "../../actions";
import { AdminNav, AdminTitle } from "../../_components/AdminNav";
import { RecordForm } from "../../_components/RecordForm";

export const metadata: Metadata = { title: "Add assay result" };

export default async function NewAssayPage(props: PageProps<"/admin/assays/new">) {
  await requireAdmin();
  const params = await props.searchParams;
  const compound = getParam(params, "compound")?.toUpperCase() ?? "";
  const codes = await prisma.compound.findMany({ select: { code: true }, orderBy: { code: "asc" }, take: 5000 });
  return (
    <>
      <AdminNav current="/admin/assays" />
      <AdminTitle title="Add assay result" description="Link the result to an existing compound by its code." />
      <RecordForm
        kind="Assays"
        action={saveAssayAction}
        initialValues={{ compound_code: compound }}
        submitLabel="Create assay result"
        cancelHref="/admin/assays"
        compoundCodes={codes.map((c) => c.code)}
      />
    </>
  );
}
