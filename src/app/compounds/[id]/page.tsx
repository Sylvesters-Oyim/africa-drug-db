import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ActivityBadge } from "@/components/ActivityBadge";
import { DiseaseTags } from "@/components/DiseaseTags";
import { FictionalDataNotice } from "@/components/FictionalDataNotice";
import { PageShell } from "@/components/PageShell";
import { MoleculeIcon } from "@/components/ScienceIcons";
import { prisma } from "@/lib/db";
import { formatDate, formatResult } from "@/lib/format";

// Reads from the database at request time; never prerender at build time.
export const dynamic = "force-dynamic";

// Deduplicate the query between generateMetadata and the page render.
const getCompound = cache(async (id: string) =>
  prisma.compound.findUnique({
    where: { id },
    include: { assays: { orderBy: [{ assayType: "asc" }, { createdAt: "asc" }] } },
  }),
);

export async function generateMetadata(props: PageProps<"/compounds/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const compound = await getCompound(id);
  return { title: compound ? compound.name : "Compound not found" };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-semibold text-navy-muted">{label}</dt>
      <dd className="mt-1 text-sm text-navy sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}

const summaryRows = [
  { label: "ACTIVE", name: "Active", bar: "bg-mint" },
  { label: "INCONCLUSIVE", name: "Inconclusive", bar: "bg-orange" },
  { label: "INACTIVE", name: "Inactive", bar: "bg-blush-400" },
] as const;

function ActivitySummary({ assays }: { assays: { activityLabel: string }[] }) {
  const total = assays.length;
  return (
    <section className="reveal card flex flex-col p-6" style={{ ["--reveal-delay" as string]: "100ms" }}>
      <h2 className="text-lg font-bold text-navy">Activity summary</h2>
      <p className="mt-1 text-sm text-navy-muted">
        {total} assay result{total === 1 ? "" : "s"} recorded
      </p>
      <ul className="mt-5 space-y-4">
        {summaryRows.map((row) => {
          const count = assays.filter((a) => a.activityLabel === row.label).length;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <li key={row.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-navy">{row.name}</span>
                <span className="tabular-nums text-navy-muted">
                  {count} · {pct}%
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-blush/70">
                <div className={`grow-bar h-full rounded-full ${row.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <MoleculeIcon className="mt-auto h-16 w-16 self-end pt-4 opacity-80 motion-safe:animate-float" />
    </section>
  );
}

const empty = <span className="text-navy-muted/50">Not recorded</span>;

export default async function CompoundPage(props: PageProps<"/compounds/[id]">) {
  const { id } = await props.params;
  const compound = await getCompound(id);
  if (!compound) notFound();

  return (
    <PageShell>
      <div className="reveal">
        <Link href="/compounds" className="text-sm font-semibold text-teal-800 transition hover:text-orange-800">
          ← All compounds
        </Link>
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange/20 shadow-soft"
          >
            <MoleculeIcon className="h-9 w-9" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">{compound.name}</h1>
            <div className="mt-3">
              <DiseaseTags tags={compound.diseaseTags} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="reveal card px-5 sm:px-7 lg:col-span-2">
          <h2 className="sr-only">Compound details</h2>
          <dl className="divide-y divide-blush-300/50">
            <Field label="Source region">{compound.sourceRegion}</Field>
            <Field label="Source notes">{compound.sourceNotes ?? empty}</Field>
            <Field label="Molecular formula">
              {compound.formula ? <span className="font-mono">{compound.formula}</span> : empty}
            </Field>
            <Field label="SMILES">
              {compound.smiles ? <span className="break-all font-mono">{compound.smiles}</span> : empty}
            </Field>
            <Field label="InChIKey">
              {compound.inchikey ? <span className="break-all font-mono">{compound.inchikey}</span> : empty}
            </Field>
            <Field label="Added">{formatDate(compound.createdAt)}</Field>
          </dl>
        </section>

        <ActivitySummary assays={compound.assays} />
      </div>

      <section className="reveal">
        <h2 className="text-xl font-bold text-navy">
          Assay results <span className="font-normal text-navy-muted">({compound.assays.length})</span>
        </h2>
        {compound.assays.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-blush-300 bg-white/50 p-6 text-center text-navy-muted">
            No assay results recorded for this compound.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-blush-300/70 bg-white/80 shadow-soft">
            <table className="min-w-full divide-y divide-blush-300/60 text-sm">
              <thead className="bg-blush/40 text-left text-xs font-bold uppercase tracking-wide text-navy-muted">
                <tr>
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
                  <th scope="col" className="px-4 py-3">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-300/40">
                {compound.assays.map((a) => (
                  <tr key={a.id} className="transition hover:bg-orange/10">
                    <td className="px-4 py-3 font-semibold text-navy">{a.assayType}</td>
                    <td className="px-4 py-3 text-navy-muted">{a.target ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-navy-muted">
                      {formatResult(a.resultValue, a.resultUnit)}
                    </td>
                    <td className="px-4 py-3">
                      <ActivityBadge label={a.activityLabel} />
                    </td>
                    <td className="px-4 py-3 text-navy-muted">{a.performedInCountry ?? "—"}</td>
                    <td className="px-4 py-3 text-navy-muted">{a.reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <FictionalDataNotice />
    </PageShell>
  );
}
