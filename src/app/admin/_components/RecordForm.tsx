"use client";

import Link from "next/link";
import { useActionState } from "react";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { ASSAY_COLUMNS, COMPOUND_COLUMNS, type ColumnDef } from "@/lib/import/columns";
import type { FormState, FormValues } from "@/lib/admin/forms";
import { DISEASES } from "@/lib/diseases";

type Kind = "Compounds" | "Assays";

const SECTIONS: Record<Kind, { title: string; hint?: string; fields: string[] }[]> = {
  Compounds: [
    { title: "Compound", fields: ["code", "name", "source_region", "country_of_origin", "disease_tags"] },
    { title: "Chemistry", fields: ["formula", "inchikey", "smiles"] },
    {
      title: "Origin & access and benefit-sharing",
      hint: "Collection details and Nagoya Protocol / ABS permit reference, if applicable.",
      fields: ["collection_date", "abs_permit_ref", "source_notes"],
    },
    {
      title: "Source & licence",
      hint: "Where this record comes from and the licence it may be reused under.",
      fields: ["source_type", "source_name", "license", "source_record_id", "source_url", "doi", "citation"],
    },
    { title: "Flags", fields: ["is_example"] },
  ],
  Assays: [
    {
      title: "Result",
      fields: ["compound_code", "assay_type", "activity", "measurement_type", "relation", "value", "units"],
    },
    { title: "Target & context", fields: ["target", "organism", "performed_in_country", "reference"] },
    {
      title: "Source & licence",
      hint: "Records with a source record ID are de-duplicated on compound + that ID during imports.",
      fields: ["source_type", "source_name", "license", "source_record_id", "source_url", "doi", "citation"],
    },
    { title: "Flags", fields: ["is_example"] },
  ],
};

const LABELS: Record<string, string> = {
  code: "Code",
  name: "Name",
  source_region: "Source region",
  country_of_origin: "Country of origin",
  disease_tags: "Disease tags",
  smiles: "SMILES",
  inchikey: "InChIKey",
  formula: "Molecular formula",
  source_notes: "Source notes",
  collection_date: "Collection date",
  abs_permit_ref: "ABS / IRCC permit reference",
  source_type: "Source type",
  source_name: "Source name",
  source_url: "Source URL",
  doi: "DOI",
  citation: "Citation",
  license: "Licence",
  source_record_id: "Source record ID",
  is_example: "Example (fictional) record",
  compound_code: "Compound code",
  assay_type: "Assay type",
  activity: "Activity",
  measurement_type: "Measurement type",
  relation: "Relation",
  value: "Value",
  units: "Units",
  target: "Target",
  organism: "Organism",
  performed_in_country: "Performed in country",
  reference: "Reference note",
};

const WIDE = new Set(["smiles", "citation", "source_notes", "name", "disease_tags", "source_url"]);
const TEXTAREA = new Set(["smiles", "citation", "source_notes"]);

function Field({
  col,
  value,
  error,
  compoundCodes,
}: {
  col: ColumnDef;
  value: string;
  error?: string;
  compoundCodes?: string[];
}) {
  const id = `f-${col.header}`;
  const label = LABELS[col.header] ?? col.header;
  const describedBy = error ? `${id}-error` : `${id}-hint`;
  const common = {
    id,
    name: col.header,
    defaultValue: value,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: `${inputClass} ${error ? "border-orange-800/60 ring-2 ring-orange/30" : ""}`,
  };

  let control: React.ReactNode;
  if (col.kind === "boolean") {
    return (
      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 rounded-xl border border-blush-300/70 bg-white/70 p-3.5 text-sm text-navy">
          <input
            type="checkbox"
            name={col.header}
            defaultChecked={value === "TRUE"}
            className="mt-0.5 h-4 w-4 accent-orange"
          />
          <span>
            <span className="font-semibold">{label}</span>
            <span className="block text-navy-muted">
              Tick for fictional/demo data. Example records are labelled on the public site and removed by{" "}
              <code className="font-mono text-xs">npm run clear-examples</code>.
            </span>
          </span>
        </label>
      </div>
    );
  }
  if (col.kind === "tags") {
    const selected = new Set(value.split(";").map((s) => s.trim()).filter(Boolean));
    control = (
      <fieldset className="mt-1.5 flex flex-wrap gap-2" aria-describedby={describedBy}>
        <legend className="sr-only">{label}</legend>
        {DISEASES.map((d) => (
          <label
            key={d.tag}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-teal/30 bg-teal-100/60 px-3 py-1.5 text-sm font-medium text-teal-800 has-[:checked]:bg-teal has-[:checked]:text-white"
          >
            <input type="checkbox" name={col.header} value={d.tag} defaultChecked={selected.has(d.tag)} className="sr-only" />
            {d.label}
          </label>
        ))}
      </fieldset>
    );
  } else if (col.kind === "enum") {
    control = (
      <select {...common}>
        {!col.required || !value ? <option value="">{col.required ? "Choose…" : "—"}</option> : null}
        {col.allowed?.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    );
  } else if (TEXTAREA.has(col.header)) {
    control = <textarea {...common} rows={col.header === "smiles" ? 2 : 3} />;
  } else {
    control = (
      <input
        {...common}
        type={col.kind === "date" ? "date" : col.kind === "url" ? "url" : "text"}
        inputMode={col.kind === "number" ? "decimal" : undefined}
        list={col.header === "compound_code" && compoundCodes ? "compound-codes" : undefined}
        autoComplete="off"
        spellCheck={col.kind === "text" && !["smiles", "formula"].includes(col.header)}
        className={`${common.className} ${["code", "compound_code", "inchikey", "smiles", "formula", "doi"].includes(col.header) ? "font-mono" : ""}`}
      />
    );
  }

  return (
    <div className={WIDE.has(col.header) ? "sm:col-span-2" : undefined}>
      <label htmlFor={col.kind === "tags" ? undefined : id} className={labelClass}>
        {label}
        {col.required ? <span className="ml-1 text-orange-800">*</span> : null}
      </label>
      {control}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-orange-800">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-navy-muted">
          {col.kind === "tags" ? "Select all disease areas that apply." : col.description}
        </p>
      )}
      {col.header === "compound_code" && compoundCodes ? (
        <datalist id="compound-codes">
          {compoundCodes.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      ) : null}
    </div>
  );
}

export function RecordForm({
  kind,
  action,
  initialValues,
  id,
  submitLabel,
  cancelHref,
  compoundCodes,
}: {
  kind: Kind;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initialValues: FormValues;
  id?: string;
  submitLabel: string;
  cancelHref: string;
  compoundCodes?: string[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? initialValues;
  const errors = state.fieldErrors ?? {};
  const columns = kind === "Compounds" ? COMPOUND_COLUMNS : ASSAY_COLUMNS;
  const byHeader = new Map(columns.map((c) => [c.header, c]));

  return (
    <form id="record-form" action={formAction} className="space-y-6" noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {state.message || errors._form ? (
        <p role="alert" className="rounded-2xl border border-orange/40 bg-orange-100/90 px-4 py-3 text-sm font-medium text-orange-800">
          {errors._form ?? state.message}
        </p>
      ) : null}
      {SECTIONS[kind].map((section) => (
        <section key={section.title} className="card p-5 sm:p-7">
          <h2 className="text-lg font-bold text-navy">{section.title}</h2>
          {section.hint ? <p className="mt-1 text-sm text-navy-muted">{section.hint}</p> : null}
          <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {section.fields.map((h) => {
              const col = byHeader.get(h);
              return col ? (
                <Field key={h} col={col} value={values[h] ?? ""} error={errors[h]} compoundCodes={compoundCodes} />
              ) : null;
            })}
          </div>
        </section>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={`${primaryButtonClass} disabled:opacity-60`}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href={cancelHref} className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
