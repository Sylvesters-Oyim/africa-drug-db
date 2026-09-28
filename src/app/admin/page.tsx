import Link from "next/link";
import { primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { AdminNav, AdminTitle } from "./_components/AdminNav";

export default async function AdminHome() {
  await requireAdmin();
  const [compounds, exampleCompounds, assays, exampleAssays, noLicence] = await Promise.all([
    prisma.compound.count(),
    prisma.compound.count({ where: { isExample: true } }),
    prisma.assay.count(),
    prisma.assay.count({ where: { OR: [{ isExample: true }, { compound: { isExample: true } }] } }),
    prisma.compound.count({ where: { isExample: false, OR: [{ license: null }, { license: "" }] } }),
  ]);
  const stats = [
    { label: "Compounds", value: compounds, sub: `${exampleCompounds} example`, cls: "from-orange/25" },
    { label: "Assay results", value: assays, sub: `${exampleAssays} example`, cls: "from-mint/35" },
    { label: "Real compounds without licence", value: noLicence, sub: "add a licence for reuse", cls: "from-teal/30" },
  ];
  return (
    <>
      <AdminNav current="/admin" />
      <AdminTitle title="Data admin" description="Import spreadsheets, add or correct single records, and track provenance.">
        <Link href="/admin/import" className={primaryButtonClass}>
          Import spreadsheet
        </Link>
        <Link href="/admin/compounds/new" className={secondaryButtonClass}>
          Add compound
        </Link>
      </AdminTitle>
      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`card bg-gradient-to-br ${s.cls} via-white/80 to-white p-5`}>
            <p className="text-sm font-semibold text-navy-muted">{s.label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-navy">{s.value}</p>
            <p className="mt-1 text-xs text-navy-muted">{s.sub}</p>
          </div>
        ))}
      </section>
      {exampleCompounds > 0 ? (
        <p className="rounded-2xl border border-orange/40 bg-orange-100/90 px-4 py-3 text-sm text-orange-800">
          The database still contains <strong>{exampleCompounds}</strong> example compounds. The public
          &ldquo;fictional data&rdquo; notice stays visible until they are removed with{" "}
          <code className="font-mono">npm run clear-examples</code> (see README) or deleted here.
        </p>
      ) : null}
    </>
  );
}
