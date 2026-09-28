import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ActivityBadge } from "@/components/ActivityBadge";
import { DiseaseTags } from "@/components/DiseaseTags";
import { ExampleBadge } from "@/components/ExampleBadge";
import { FictionalDataNotice } from "@/components/FictionalDataNotice";
import { PageShell } from "@/components/PageShell";
import { MoleculeIcon } from "@/components/ScienceIcons";
import { prisma } from "@/lib/db";
import { SOURCE_TYPE_LABELS, formatDate, formatDay, formatMeasurement } from "@/lib/format";

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

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all font-semibold text-teal-800 underline decoration-teal/40 underline-offset-2 transition hover:text-orange-800"
    >
      {children}
    </a>
  );
}

type Provenance = {
  sourceType: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  doi: string | null;
  citation: string | null;
  license: string | null;
  sourceRecordId: string | null;
};

function SourceLicenceCard({
  compound,
}: {
  compound: Provenance & {
    countryOfOrigin: string | null;
    collectionDate: Date | null;
    absPermitRef: string | null;
    isExample: boolean;
  };
}) {
  const c = compound;
  return (
    <section className="reveal card p-6 sm:p-7" aria-labelledby="source-licence">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="source-licence" className="text-lg font-bold text-navy">
          Source &amp; licence
        </h2>
        {c.license ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-100 px-3 py-1 text-xs font-semibold text-mint-800 ring-1 ring-inset ring-mint/50">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-mint-800" />
            {c.license}
          </span>
        ) : null}
      </div>
      <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
        <div className="divide-y divide-blush-300/50">
          <Field label="Source type">{c.sourceType ? SOURCE_TYPE_LABELS[c.sourceType] ?? c.sourceType : empty}</Field>
          <Field label="Source">
            {c.sourceName ? (c.sourceUrl ? <ExternalLink href={c.sourceUrl}>{c.sourceName}</ExternalLink> : c.sourceName) : empty}
          </Field>
          <Field label="Source record ID">
            {c.sourceRecordId ? <span className="break-all font-mono text-xs">{c.sourceRecordId}</span> : empty}
          </Field>
          <Field label="DOI">{c.doi ? <ExternalLink href={`https://doi.org/${c.doi}`}>{c.doi}</ExternalLink> : empty}</Field>
          <Field label="Licence">{c.license ?? empty}</Field>
        </div>
        <div className="divide-y divide-blush-300/50">
          <Field label="Country of origin">{c.countryOfOrigin ?? empty}</Field>
          <Field label="Collection date">{c.collectionDate ? formatDay(c.collectionDate) : empty}</Field>
          <Field label="ABS / IRCC permit">
            {c.absPermitRef ? <span className="break-all font-mono text-xs">{c.absPermitRef}</span> : empty}
          </Field>
          <Field label="Citation">{c.citation ?? empty}</Field>
        </div>
      </dl>
      {c.isExample ? (
        <p className="mt-4 rounded-xl bg-orange-100/80 px-3.5 py-2.5 text-sm text-orange-800">
          This is a fictional example record. Its source details are placeholders.
        </p>
      ) : null}
    </section>
  );
}

function assaySource(a: Provenance & { reference: string | null }) {
  const name = a.sourceName ?? a.reference;
  if (!name && !a.doi) return <span className="text-navy-muted/60">—</span>;
  const href = a.sourceUrl ?? (a.doi ? `https://doi.org/${a.doi}` : null);
  return (
    <span className="block min-w-40">
      {name ? href ? <ExternalLink href={href}>{name}</ExternalLink> : <span className="text-navy">{name}</span> : null}
      {a.doi && !name ? <ExternalLink href={`https://doi.org/${a.doi}`}>{a.doi}</ExternalLink> : null}
      {a.sourceRecordId || a.license ? (
        <span className="mt-0.5 block text-xs text-navy-muted">
          {[a.sourceRecordId, a.license].filter(Boolean).join(" · ")}
        </span>
      ) : null}
    </span>
  );
}

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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {compound.name.startsWith(compound.code) ? null : (
                <span className="rounded-full bg-navy/5 px-2.5 py-0.5 font-mono text-xs font-semibold text-navy">
                  {compound.code}
                </span>
              )}
              {compound.isExample ? <ExampleBadge /> : null}
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

      <SourceLicenceCard compound={compound} />

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
                    Target / organism
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
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-300/40">
                {compound.assays.map((a) => (
                  <tr key={a.id} className="transition hover:bg-orange/10">
                    <td className="px-4 py-3 font-semibold text-navy">
                      {a.assayType} {a.isExample ? <ExampleBadge className="ml-1" /> : null}
                    </td>
                    <td className="px-4 py-3 text-navy-muted">
                      {[a.target, a.organism].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-navy-muted">{formatMeasurement(a)}</td>
                    <td className="px-4 py-3">
                      <ActivityBadge label={a.activityLabel} />
                    </td>
                    <td className="px-4 py-3 text-navy-muted">{a.performedInCountry ?? "—"}</td>
                    <td className="px-4 py-3 text-sm">{assaySource(a)}</td>
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
