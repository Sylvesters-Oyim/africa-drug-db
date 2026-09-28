import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { getPage, getParam } from "@/lib/search-params";
import { AdminNav, AdminTitle, ExampleBadge, Notice } from "../_components/AdminNav";

export const metadata: Metadata = { title: "Compounds" };
const PAGE_SIZE = 40;

export default async function AdminCompoundsPage(props: PageProps<"/admin/compounds">) {
  await requireAdmin();
  const params = await props.searchParams;
  const q = getParam(params, "q");
  const examples = getParam(params, "examples");
  const page = getPage(params);
  const where: Prisma.CompoundWhereInput = {
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { sourceRecordId: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(examples === "only" ? { isExample: true } : examples === "hide" ? { isExample: false } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.compound.findMany({
      where,
      orderBy: { code: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { assays: true } } },
    }),
    prisma.compound.count({ where }),
  ]);

  return (
    <>
      <AdminNav current="/admin/compounds" />
      <AdminTitle title="Compounds" description={`${total} matching record${total === 1 ? "" : "s"}.`}>
        <Link href="/admin/compounds/new" className={primaryButtonClass}>
          Add compound
        </Link>
      </AdminTitle>
      {getParam(params, "deleted") ? <Notice tone="orange">Compound deleted (with its assay results).</Notice> : null}
      <form action="/admin/compounds" className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-60 flex-1">
          <label htmlFor="q" className="sr-only">
            Search
          </label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Search code, name or source record ID" className={inputClass} />
        </div>
        <select name="examples" defaultValue={examples ?? ""} aria-label="Example records" className={`${inputClass} w-auto`}>
          <option value="">All records</option>
          <option value="hide">Real data only</option>
          <option value="only">Examples only</option>
        </select>
        <button type="submit" className={secondaryButtonClass}>
          Search
        </button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-blush-300/70 bg-white/85 shadow-soft">
        <table className="min-w-full divide-y divide-blush-300/60 text-sm">
          <thead className="bg-blush/40 text-left text-xs font-bold uppercase tracking-wide text-navy-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Code</th>
              <th scope="col" className="px-4 py-3">Name</th>
              <th scope="col" className="px-4 py-3">Origin</th>
              <th scope="col" className="px-4 py-3">Source</th>
              <th scope="col" className="px-4 py-3">Licence</th>
              <th scope="col" className="px-4 py-3 text-right">Assays</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blush-300/40">
            {rows.map((c) => (
              <tr key={c.id} className="transition hover:bg-orange/10">
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">
                  <Link href={`/admin/compounds/${c.id}`} className="font-semibold text-navy hover:text-orange-800">
                    {c.code}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/compounds/${c.id}`} className="font-semibold text-navy hover:text-orange-800">
                    {c.name}
                  </Link>{" "}
                  {c.isExample ? <ExampleBadge /> : null}
                </td>
                <td className="px-4 py-2.5 text-navy-muted">{c.countryOfOrigin ?? c.sourceRegion}</td>
                <td className="px-4 py-2.5 text-navy-muted">{c.sourceName ?? "—"}</td>
                <td className="px-4 py-2.5 text-navy-muted">{c.license ?? "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-navy-muted">{c._count.assays}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-navy-muted">
                  No compounds found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/admin/compounds" page={page} pageSize={PAGE_SIZE} total={total} query={{ q, examples }} />
    </>
  );
}
