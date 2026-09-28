"use client";

import { useRef, useState, useTransition } from "react";
import { primaryButtonClass, secondaryButtonClass } from "@/components/form";
import type { Counts, ImportResult } from "@/lib/import/run";
import { type ImportActionResult, importAction } from "../actions";

function signature(files: FileList | null): string {
  if (!files) return "";
  return Array.from(files)
    .map((f) => `${f.name}:${f.size}:${f.lastModified}`)
    .join("|");
}

function CountCard({ title, counts, committed }: { title: string; counts: Counts; committed: boolean }) {
  const items = [
    { label: committed ? "Created" : "To create", value: counts.create, cls: "bg-mint-100 text-mint-800" },
    { label: committed ? "Updated" : "To update", value: counts.update, cls: "bg-orange-100 text-orange-800" },
    { label: "Unchanged", value: counts.unchanged, cls: "bg-navy/5 text-navy-muted" },
  ];
  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-navy-muted">{title}</h3>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {items.map((i) => (
          <div key={i.label} className={`rounded-2xl px-3 py-2.5 ${i.cls}`}>
            <dt className="text-xs font-semibold">{i.label}</dt>
            <dd className="text-2xl font-bold tabular-nums">{i.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ResultView({ result }: { result: ImportResult }) {
  const problems = result.errors.length + result.fileErrors.length;
  const tone = result.committed
    ? "border-mint/60 bg-mint-100 text-mint-800"
    : problems
      ? "border-orange/40 bg-orange-100/90 text-orange-800"
      : "border-teal/40 bg-teal-100 text-teal-800";
  const headline = result.committed
    ? "Import complete. The public pages now show the new data."
    : problems
      ? `${problems} problem${problems === 1 ? "" : "s"} found. Nothing has been written. Fix the file and preview again.`
      : "Preview only: no problems found. Nothing has been written yet.";

  return (
    <section aria-live="polite" className="space-y-4">
      <p role="status" className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${tone}`}>
        {headline}
        {result.sources.length ? (
          <span className="mt-0.5 block font-normal opacity-80">Read: {result.sources.join(", ")}</span>
        ) : null}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <CountCard title="Compounds" counts={result.compounds} committed={result.committed} />
        <CountCard title="Assays" counts={result.assays} committed={result.committed} />
      </div>
      {result.fileErrors.length ? (
        <ul className="card list-disc space-y-1 p-5 pl-9 text-sm text-orange-800">
          {result.fileErrors.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      ) : null}
      {result.errors.length ? (
        <div className="overflow-x-auto rounded-2xl border border-blush-300/70 bg-white/85 shadow-soft">
          <table className="min-w-full divide-y divide-blush-300/60 text-sm">
            <caption className="px-4 pt-4 text-left text-base font-bold text-navy">Row errors</caption>
            <thead className="bg-blush/40 text-left text-xs font-bold uppercase tracking-wide text-navy-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Sheet</th>
                <th scope="col" className="px-4 py-3">Row</th>
                <th scope="col" className="px-4 py-3">Column</th>
                <th scope="col" className="px-4 py-3">Problem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blush-300/40">
              {result.errors.slice(0, 500).map((e, i) => (
                <tr key={i} className="align-top">
                  <td className="px-4 py-2.5 font-semibold text-navy">{e.sheet}</td>
                  <td className="px-4 py-2.5 tabular-nums text-navy">{e.rowNumber}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-navy-muted">{e.column ?? "—"}</td>
                  <td className="px-4 py-2.5 text-orange-800">{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.errors.length > 500 ? (
            <p className="px-4 py-3 text-sm text-navy-muted">…and {result.errors.length - 500} more.</p>
          ) : null}
        </div>
      ) : null}
      {result.warnings.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-navy-muted">
          {result.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function ImportForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportActionResult | null>(null);
  const [previewedSig, setPreviewedSig] = useState<string | null>(null);
  const [currentSig, setCurrentSig] = useState("");
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"dry-run" | "commit" | null>(null);

  const result = state?.result;
  const canCommit =
    !pending &&
    result?.dryRun === true &&
    result.errors.length === 0 &&
    result.fileErrors.length === 0 &&
    previewedSig === currentSig &&
    currentSig !== "" &&
    result.compounds.create + result.compounds.update + result.assays.create + result.assays.update > 0;

  function run(nextMode: "dry-run" | "commit") {
    const files = inputRef.current?.files;
    if (!files || files.length === 0) {
      setState({ error: "Choose at least one CSV or XLSX file." });
      return;
    }
    const fd = new FormData();
    for (const f of Array.from(files)) fd.append("files", f);
    fd.set("mode", nextMode);
    const sig = signature(files);
    setMode(nextMode);
    startTransition(async () => {
      const res = await importAction(fd);
      setState(res);
      setPreviewedSig(nextMode === "dry-run" ? sig : null);
    });
  }

  return (
    <div className="space-y-6">
      <form
        className="card space-y-5 p-5 sm:p-7"
        onSubmit={(e) => {
          e.preventDefault();
          run("dry-run");
        }}
      >
        <div>
          <label htmlFor="files" className="block text-sm font-semibold text-navy">
            Spreadsheet file(s)
          </label>
          <p className="mt-1 text-sm text-navy-muted">
            One combined .xlsx (sheets <em>Compounds</em> and <em>Assays</em>), or compounds.csv and/or assays.csv.
            Max 4 MB per file.
          </p>
          <input
            ref={inputRef}
            id="files"
            name="files"
            type="file"
            multiple
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              setCurrentSig(signature(e.currentTarget.files));
              setState(null);
            }}
            className="mt-3 block w-full rounded-2xl border border-dashed border-blush-400 bg-cream-50/80 p-4 text-sm text-navy file:mr-4 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-navy-900"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button id="preview-button" type="submit" disabled={pending} className={`${secondaryButtonClass} disabled:opacity-60`}>
            {pending && mode === "dry-run" ? "Checking…" : "1. Preview (dry run)"}
          </button>
          <button
            id="import-button"
            type="button"
            disabled={!canCommit}
            onClick={() => run("commit")}
            className={`${primaryButtonClass} disabled:pointer-events-none disabled:opacity-40`}
          >
            {pending && mode === "commit" ? "Importing…" : "2. Import"}
          </button>
          <span className="text-xs text-navy-muted">
            Import unlocks after a clean preview of the same file(s). It runs as one transaction: all rows or none.
          </span>
        </div>
      </form>

      {state?.error ? (
        <p role="alert" className="rounded-2xl border border-orange/40 bg-orange-100/90 px-4 py-3 text-sm font-medium text-orange-800">
          {state.error}
        </p>
      ) : null}
      {result ? <ResultView result={result} /> : null}
    </div>
  );
}
