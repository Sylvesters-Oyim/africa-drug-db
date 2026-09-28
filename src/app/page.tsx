import Link from "next/link";
import { FictionalDataNotice } from "@/components/FictionalDataNotice";
import { HeroBand } from "@/components/HeroBand";
import { PageShell } from "@/components/PageShell";
import { StatCard } from "@/components/StatCard";
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
    <PageShell>
      <HeroBand>
        <p className="reveal inline-flex items-center gap-2 rounded-full border border-blush-300/80 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-800">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-orange" />
          Compounds &amp; assay results
        </p>
        <h1 className="reveal mt-5 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-navy sm:text-5xl xl:text-6xl">
          An Africa-focused database for drug discovery research
        </h1>
        <p className="reveal mt-5 max-w-xl text-lg text-navy-muted" style={{ ["--reveal-delay" as string]: "80ms" }}>
          Search, filter and browse chemical compounds sourced across Africa together with their assay results, with a
          focus on diseases that carry a heavy burden on the continent.
        </p>
        <div className="reveal mt-8 flex flex-wrap gap-3" style={{ ["--reveal-delay" as string]: "140ms" }}>
          <Link href="/compounds" className={primaryButtonClass}>
            Browse compounds
          </Link>
          <Link href="/assays" className={secondaryButtonClass}>
            Browse assays
          </Link>
        </div>
      </HeroBand>

      {stats ? (
        <section aria-label="Database statistics" className="grid grid-cols-3 gap-3 sm:gap-5">
          <StatCard label="Compounds" value={stats.compounds} accent="orange" delay={0} />
          <StatCard label="Assay results" value={stats.assays} accent="mint" delay={80} />
          <StatCard label="Source regions" value={stats.regions} accent="teal" delay={160} />
        </section>
      ) : null}

      <section className="reveal card p-6 sm:p-8">
        <h2 className="text-xl font-bold text-navy">Browse by disease</h2>
        <p className="mt-1 text-sm text-navy-muted">Jump straight into compounds tagged for a disease of interest.</p>
        <ul className="mt-5 flex flex-wrap gap-2.5">
          {DISEASES.map((d) => (
            <li key={d.tag}>
              <Link
                href={`/compounds?disease=${d.tag}`}
                className="inline-flex items-center rounded-full border border-teal/30 bg-teal-100/70 px-3.5 py-1.5 text-sm font-semibold text-teal-800 transition hover:-translate-y-0.5 hover:bg-teal hover:text-white"
              >
                {d.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <FictionalDataNotice />
    </PageShell>
  );
}
