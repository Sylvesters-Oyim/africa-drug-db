import Link from "next/link";
import { FictionalDataNotice } from "@/components/FictionalDataNotice";
import { primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { prisma } from "@/lib/db";
import { DISEASES } from "@/lib/diseases";

// Reads from the database at request time; never prerender at build time.
export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [compounds, assays, regions] = await Promise.all([
      prisma.compound.count(),
      prisma.assay.count(),
      prisma.compound.findMany({ distinct: ["sourceRegion"], select: { sourceRegion: true } }),
    ]);
    return { compounds, assays, regions: regions.length };
  } catch (error) {
    console.error("Failed to load stats", error);
    return null;
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          Compounds &amp; assay results
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          An Africa-focused database for drug discovery research
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Search, filter and browse chemical compounds sourced across Africa together with their assay results, with a
          focus on diseases that carry a heavy burden on the continent.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/compounds" className={primaryButtonClass}>
            Browse compounds
          </Link>
          <Link href="/assays" className={secondaryButtonClass}>
            Browse assays
          </Link>
        </div>
      </section>

      {stats ? (
        <section aria-label="Database statistics" className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Compounds", value: stats.compounds },
            { label: "Assay results", value: stats.assays },
            { label: "Source regions", value: stats.regions },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">{s.label}</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Browse by disease</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {DISEASES.map((d) => (
            <li key={d.tag}>
              <Link
                href={`/compounds?disease=${d.tag}`}
                className="inline-block rounded-full border border-teal-200 bg-white px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-50"
              >
                {d.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <FictionalDataNotice />
    </div>
  );
}
