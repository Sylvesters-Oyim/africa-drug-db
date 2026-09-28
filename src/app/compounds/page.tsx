import type { Metadata } from "next";
import Link from "next/link";
import { DiseaseTags } from "@/components/DiseaseTags";
import { ExampleBadge } from "@/components/ExampleBadge";
import { FictionalDataNotice } from "@/components/FictionalDataNotice";
import {
  LiveFilterForm,
  LiveFilterProvider,
  LiveResults,
  PendingIndicator,
  ResetButton,
} from "@/components/LiveFilters";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { Pagination } from "@/components/Pagination";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { DISEASES } from "@/lib/diseases";
import { getPage, getParam } from "@/lib/search-params";

// Reads from the database at request time; never prerender at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Compounds" };

const PAGE_SIZE = 24;

export default async function CompoundsPage(props: PageProps<"/compounds">) {
  const params = await props.searchParams;
  const q = getParam(params, "q");
  const disease = getParam(params, "disease");
  const region = getParam(params, "region");
  const page = getPage(params);

  const where: Prisma.CompoundWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
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
    <PageShell>
      <PageHeader
        title="Compounds"
        description="Search compounds by name and filter by disease area or source region. Results update as you type."
      />

      <LiveFilterProvider>
        <LiveFilterForm
          action="/compounds"
          className="reveal card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        >
          <div>
            <label htmlFor="q" className={labelClass}>
              Name
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Name or code, e.g. ADD-0001"
              autoComplete="off"
              className={inputClass}
            />
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
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className={primaryButtonClass}>
              Search
            </button>
            {hasFilters ? (
              <ResetButton href="/compounds" className={secondaryButtonClass}>
                Reset
              </ResetButton>
            ) : null}
          </div>
        </LiveFilterForm>

        <LiveResults>
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-navy-muted" aria-live="polite">
              {total} {total === 1 ? "compound" : "compounds"} found
            </p>
            <PendingIndicator />
          </div>

          {compounds.length === 0 ? (
            <div className="reveal rounded-2xl border border-dashed border-blush-300 bg-white/50 p-10 text-center text-navy-muted">
              No compounds match these filters.
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {compounds.map((c, i) => (
                <li
                  key={c.id}
                  className="reveal card lift group flex flex-col p-5"
                  style={{ ["--reveal-delay" as string]: `${Math.min(i, 8) * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/compounds/${c.id}`}
                      className="text-lg font-bold text-navy transition group-hover:text-orange-800"
                    >
                      {c.name}
                    </Link>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-navy-muted">
                        {c._count.assays} assay{c._count.assays === 1 ? "" : "s"}
                      </span>
                      {c.isExample ? <ExampleBadge /> : null}
                    </span>
                  </div>
                  {c.name.startsWith(c.code) ? null : (
                    <p className="mt-1 font-mono text-xs font-semibold text-navy-muted">{c.code}</p>
                  )}
                  <p className="mt-2 text-sm text-navy-muted">
                    <span className="font-medium text-navy">Region:</span> {c.sourceRegion}
                  </p>
                  {c.sourceName || c.license ? (
                    <p className="mt-1 text-sm text-navy-muted">
                      <span className="font-medium text-navy">Source:</span>{" "}
                      {[c.sourceName, c.license].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  <div className="mt-4">
                    <DiseaseTags tags={c.diseaseTags} />
                  </div>
                  <Link
                    href={`/compounds/${c.id}`}
                    className="mt-5 inline-flex text-sm font-semibold text-teal-800 transition group-hover:text-orange-800"
                  >
                    View details →
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Pagination
            basePath="/compounds"
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            query={{ q, disease, region }}
          />
        </LiveResults>
      </LiveFilterProvider>

      <FictionalDataNotice />
    </PageShell>
  );
}
