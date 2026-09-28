import type { Metadata } from "next";
import Link from "next/link";
import { ActivityBadge } from "@/components/ActivityBadge";
import { Pagination } from "@/components/Pagination";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { formatMeasurement } from "@/lib/format";
import { getPage, getParam } from "@/lib/search-params";
import { AdminNav, AdminTitle, ExampleBadge } from "../_components/AdminNav";

export const metadata: Metadata = { title: "Assays" };
const PAGE_SIZE = 50;

export default async function AdminAssaysPage(props: PageProps<"/admin/assays">) {
  await requireAdmin();
  const params = await props.searchParams;
  const q = getParam(params, "q");
  const page = getPage(params);
  const where: Prisma.AssayWhereInput = q
    ? {
        OR: [
          { compound: { code: { contains: q, mode: "insensitive" } } },
          { compound: { name: { contains: q, mode: "insensitive" } } },
          { assayType: { contains: q, mode: "insensitive" } },
          { target: { contains: q, mode: "insensitive" } },
          { organism: { contains: q, mode: "insensitive" } },
          { sourceRecordId: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};
  const [rows, total] = await Promise.all([
    prisma.assay.findMany({
      where,
      orderBy: [{ compound: { code: "asc" } }, { assayType: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { compound: { select: { code: true } } },
    }),
    prisma.assay.count({ where }),
  ]);

  return (
    <>
      <AdminNav current="/admin/assays" />
      <AdminTitle title="Assay results" description={`${total} matching record${total === 1 ? "" : "s"}.`}>
        <Link href="/admin/assays/new" className={primaryButtonClass}>
          Add assay result
        </Link>
      </AdminTitle>
      <form action="/admin/assays" className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-60 flex-1">
          <label htmlFor="q" className="sr-only">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search compound code/name, assay type, target, organism or source record ID"
            className={inputClass}
          />
        </div>
        <button type="submit" className={secondaryButtonClass}>
          Search
        </button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-blush-300/70 bg-white/85 shadow-soft">
        <table className="min-w-full divide-y divide-blush-300/60 text-sm">
          <thead className="bg-blush/40 text-left text-xs font-bold uppercase tracking-wide text-navy-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Compound</th>
              <th scope="col" className="px-4 py-3">Assay</th>
              <th scope="col" className="px-4 py-3">Result</th>
              <th scope="col" className="px-4 py-3">Activity</th>
              <th scope="col" className="px-4 py-3">Source</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Edit</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blush-300/40">
            {rows.map((a) => (
              <tr key={a.id} className="transition hover:bg-orange/10">
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-navy">{a.compound.code}</td>
                <td className="px-4 py-2.5">
                  <span className="font-semibold text-navy">{a.assayType}</span>{" "}
                  {a.isExample ? <ExampleBadge /> : null}
                  <span className="block text-xs text-navy-muted">{[a.target, a.organism].filter(Boolean).join(" · ")}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-navy-muted">{formatMeasurement(a)}</td>
                <td className="px-4 py-2.5">
                  <ActivityBadge label={a.activityLabel} />
                </td>
                <td className="px-4 py-2.5 text-navy-muted">{a.sourceName ?? "—"}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/assays/${a.id}`} className="font-semibold text-teal-800 hover:text-orange-800">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-navy-muted">
                  No assay results found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/admin/assays" page={page} pageSize={PAGE_SIZE} total={total} query={{ q }} />
    </>
  );
}
