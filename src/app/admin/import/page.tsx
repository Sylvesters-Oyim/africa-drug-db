import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminNav, AdminTitle } from "../_components/AdminNav";
import { ImportForm } from "../_components/ImportForm";

export const metadata: Metadata = { title: "Import" };

const templates = [
  { href: "/templates/africa-drug-db-import-template.xlsx", label: "Combined template (.xlsx)", sub: "Compounds, Assays + Instructions sheets" },
  { href: "/templates/compounds.csv", label: "compounds.csv", sub: "Headers + 2 example rows" },
  { href: "/templates/assays.csv", label: "assays.csv", sub: "Headers + 2 example rows" },
];

export default async function ImportPage() {
  await requireAdmin();
  return (
    <>
      <AdminNav current="/admin/import" />
      <AdminTitle
        title="Import data"
        description="Upload compounds and assay results from a spreadsheet. Preview first: nothing is written until you click Import."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ImportForm />
        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="text-base font-bold text-navy">Templates</h2>
            <ul className="mt-3 space-y-2">
              {templates.map((t) => (
                <li key={t.href}>
                  <a
                    href={t.href}
                    download
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-blush-300/70 bg-white/70 px-4 py-3 transition hover:border-orange hover:bg-orange/10"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-navy">{t.label}</span>
                      <span className="block text-xs text-navy-muted">{t.sub}</span>
                    </span>
                    <span aria-hidden="true" className="text-teal-800 group-hover:text-orange-800">
                      ↓
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <section className="card space-y-2 p-5 text-sm text-navy-muted">
            <h2 className="text-base font-bold text-navy">How matching works</h2>
            <p>
              <strong className="text-navy">Compounds</strong> are matched by <code className="font-mono">code</code>: an existing
              code is updated, a new one is created.
            </p>
            <p>
              <strong className="text-navy">Assays</strong> are matched by compound code +{" "}
              <code className="font-mono">source_record_id</code> or, when that is empty, by compound code + assay type +
              target + organism + measurement type + source name + DOI.
            </p>
            <p>Re-importing the same file changes nothing. Empty cells clear that field on matched records.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
