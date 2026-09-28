import type { Metadata } from "next";
import Link from "next/link";
import { DiseaseTags } from "@/components/DiseaseTags";
import { FictionalDataNotice } from "@/components/FictionalDataNotice";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { DISEASES } from "@/lib/diseases";
import { getPage, getParam } from "@/lib/search-params";

// Reads from the database at request time; never prerender at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Compounds" };

const PAGE_SIZE = 25;

export default async function CompoundsPage(props: PageProps<"/compounds">) {
  const params = await props.searchParams;
  const q = getParam(params, "q");
  const disease = getParam(params, "disease");
  const region = getParam(params, "region");
  const page = getPage(params);

  const where: Prisma.CompoundWhereInput = {
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(disease ? { diseaseTags: { has: disease } } : {}),
    ...(region ? { sourceRegion: region } : {}),
  };

  const [compounds, total, regionRows] = await Promise.all([
    prisma.compound.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { assays: true } } },
    }),
    prisma.compound.count({ where }),
    prisma.compound.findMany({
      distinct: ["sourceRegion"],
      select: { sourceRegion: true },
      orderBy: { sourceRegion: "asc" },
    }),
  ]);
  const regions = regionRows.map((r) => r.sourceRegion);
  const hasFilters = Boolean(q || disease || region);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compounds"
        description="Search compounds by name and filter by disease area or source region."
      />

      <form
        method="get"
        action="/compounds"
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
      >
        <div>
          <label htmlFor="q" className={labelClass}>
            Name
          </label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="e.g. ADD-0001 or alkaloid" className={inputClass} />
        </div>
        <div>
          <label htmlFor="disease" className={labelClass}>
            Disease
          </label>
          <select id="disease" name="disease" defaultValue={disease ?? ""} className={inputClass}>
            <option value="">All diseases</option>
            {DISEASES.map((d) => (
              <option key={d.tag} value={d.tag}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="region" className={labelClass}>
            Source region
          </label>
          <select id="region" name="region" defaultValue={region ?? ""} className={inputClass}>
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={primaryButtonClass}>
            Apply
          </button>
          {hasFilters ? (
            <Link href="/compounds" className={secondaryButtonClass}>
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      <p className="text-sm text-slate-600" aria-live="polite">
        {total} {total === 1 ? "compound" : "compounds"} found
      </p>

      {compounds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No compounds match these filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3">Source region</th>
                <th scope="col" className="px-4 py-3">Diseases</th>
                <th scope="col" className="px-4 py-3 text-right">Assays</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {compounds.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/compounds/${c.id}`} className="font-medium text-teal-800 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{c.sourceRegion}</td>
                  <td className="px-4 py-3">
                    <DiseaseTags tags={c.diseaseTags} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{c._count.assays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination basePath="/compounds" page={page} pageSize={PAGE_SIZE} total={total} query={{ q, disease, region }} />

      <FictionalDataNotice />
    </div>
  );
}
