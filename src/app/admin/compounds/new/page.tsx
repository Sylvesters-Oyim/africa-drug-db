import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { saveCompoundAction } from "../../actions";
import { AdminNav, AdminTitle } from "../../_components/AdminNav";
import { RecordForm } from "../../_components/RecordForm";

export const metadata: Metadata = { title: "Add compound" };

export default async function NewCompoundPage() {
  await requireAdmin();
  return (
    <>
      <AdminNav current="/admin/compounds" />
      <AdminTitle title="Add compound" description="Fields marked * are required. Record provenance and licence for every real compound." />
      <RecordForm kind="Compounds" action={saveCompoundAction} initialValues={{}} submitLabel="Create compound" cancelHref="/admin/compounds" />
    </>
  );
}
