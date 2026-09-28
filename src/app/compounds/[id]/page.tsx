import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ActivityBadge } from "@/components/ActivityBadge";
import { DiseaseTags } from "@/components/DiseaseTags";
import { FictionalDataNotice } from "@/components/FictionalDataNotice";
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
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-slate-600">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}

const empty = <span className="text-slate-400">Not recorded</span>;

export default async function CompoundPage(props: PageProps<"/compounds/[id]">) {
  const { id } = await props.params;
  const compound = await getCompound(id);
  if (!compound) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/compounds" className="text-sm font-medium text-teal-800 hover:underline">
          &larr; All compounds
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{compound.name}</h1>
        <div className="mt-3">
          <DiseaseTags tags={compound.diseaseTags} />
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white px-4 shadow-sm sm:px-6">
        <h2 className="sr-only">Compound details</h2>
        <dl className="divide-y divide-slate-100">
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

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Assay results <span className="font-normal text-slate-500">({compound.assays.length})</span>
        </h2>
        {compound.assays.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">
            No assay results recorded for this compound.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Assay type</th>
                  <th scope="col" className="px-4 py-3">Target</th>
                  <th scope="col" className="px-4 py-3">Result</th>
                  <th scope="col" className="px-4 py-3">Activity</th>
                  <th scope="col" className="px-4 py-3">Performed in</th>
                  <th scope="col" className="px-4 py-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compound.assays.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{a.assayType}</td>
                    <td className="px-4 py-3 text-slate-700">{a.target ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">
                      {formatResult(a.resultValue, a.resultUnit)}
                    </td>
                    <td className="px-4 py-3">
                      <ActivityBadge label={a.activityLabel} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{a.performedInCountry ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{a.reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <FictionalDataNotice />
    </div>
  );
}
