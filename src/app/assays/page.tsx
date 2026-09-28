import type { Metadata } from "next";
import Link from "next/link";
import { ACTIVITY_LABEL_OPTIONS, ActivityBadge } from "@/components/ActivityBadge";
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
import { ActivityLabel } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { formatResult } from "@/lib/format";
import { getPage, getParam } from "@/lib/search-params";

// Reads from the database at request time; never prerender at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Assays" };

const PAGE_SIZE = 25;

function parseActivity(value: string | undefined): ActivityLabel | undefined {
  return value && value in ActivityLabel ? (value as ActivityLabel) : undefined;
}

export default async function AssaysPage(props: PageProps<"/assays">) {
  const params = await props.searchParams;
  const activity = parseActivity(getParam(params, "activity"));
  const type = getParam(params, "type");
  const page = getPage(params);

  const where: Prisma.AssayWhereInput = {
    ...(activity ? { activityLabel: activity } : {}),
    ...(type ? { assayType: type } : {}),
  };

  const [assays, total, typeRows] = await Promise.all([
    prisma.assay.findMany({
      where,
      orderBy: [{ compound: { name: "asc" } }, { assayType: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { compound: { select: { id: true, name: true } } },
    }),
    prisma.assay.count({ where }),
    prisma.assay.findMany({ distinct: ["assayType"], select: { assayType: true }, orderBy: { assayType: "asc" } }),
  ]);
  const assayTypes = typeRows.map((r) => r.assayType);
  const hasFilters = Boolean(activity || type);

  return (
    <PageShell>
      <PageHeader
        title="Assay results"
        description="Browse assay results across all compounds. Filter by activity and assay type."
      />

      <LiveFilterProvider>
        <LiveFilterForm action="/assays" className="reveal card grid gap-4 p-5 sm:grid-cols-3 sm:items-end">
          <div>
            <label htmlFor="activity" className={labelClass}>
              Activity
            </label>
            <select id="activity" name="activity" defaultValue={activity ?? ""} className={inputClass}>
              <option value="">All activity labels</option>
              {ACTIVITY_LABEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="type" className={labelClass}>
              Assay type
            </label>
            <select id="type" name="type" defaultValue={type ?? ""} className={inputClass}>
              <option value="">All assay types</option>
              {assayTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={primaryButtonClass}>
              Apply
            </button>
            {hasFilters ? (
              <ResetButton href="/assays" className={secondaryButtonClass}>
                Reset
              </ResetButton>
            ) : null}
          </div>
        </LiveFilterForm>

        <LiveResults>
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-navy-muted" aria-live="polite">
              {total} {total === 1 ? "assay result" : "assay results"} found
            </p>
            <PendingIndicator />
          </div>

          {assays.length === 0 ? (
            <div className="reveal rounded-2xl border border-dashed border-blush-300 bg-white/50 p-10 text-center text-navy-muted">
              No assay results match these filters.
            </div>
          ) : (
            <div className="reveal overflow-x-auto rounded-2xl border border-blush-300/70 bg-white/80 shadow-soft">
              <table className="min-w-full divide-y divide-blush-300/60 text-sm">
                <thead className="bg-blush/40 text-left text-xs font-bold uppercase tracking-wide text-navy-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Compound
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Assay type
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Target
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Result
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Activity
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Performed in
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blush-300/40">
                  {assays.map((a) => (
                    <tr key={a.id} className="transition hover:bg-orange/10">
                      <td className="px-4 py-3">
                        <Link
                          href={`/compounds/${a.compound.id}`}
                          className="font-semibold text-navy hover:text-orange-800"
                        >
                          {a.compound.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-navy">{a.assayType}</td>
                      <td className="px-4 py-3 text-navy-muted">{a.target ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-navy-muted">
                        {formatResult(a.resultValue, a.resultUnit)}
                      </td>
                      <td className="px-4 py-3">
                        <ActivityBadge label={a.activityLabel} />
                      </td>
                      <td className="px-4 py-3 text-navy-muted">{a.performedInCountry ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination basePath="/assays" page={page} pageSize={PAGE_SIZE} total={total} query={{ activity, type }} />
        </LiveResults>
      </LiveFilterProvider>

      <FictionalDataNotice />
    </PageShell>
  );
}
