/**
 * Column definitions for the compound and assay spreadsheet templates.
 *
 * This is the single source of truth used by the validator, the template
 * generator (scripts/generate-templates.ts) and the "Instructions" sheet.
 * Header matching is forgiving: case, spaces, hyphens and underscores are
 * ignored, so "source_name", "Source name" and "sourceName" all match.
 */
import { DISEASES } from "../diseases";

export const SOURCE_TYPES = ["LITERATURE", "DATABASE", "LAB_DEPOSIT", "OTHER"] as const;
export type SourceTypeValue = (typeof SOURCE_TYPES)[number];

export const ACTIVITY_LABELS = ["ACTIVE", "INACTIVE", "INCONCLUSIVE"] as const;
export type ActivityValue = (typeof ACTIVITY_LABELS)[number];

export const RELATIONS = ["=", "<", ">", "<=", ">=", "~"] as const;
export type RelationValue = (typeof RELATIONS)[number];

/** Suggested (not enforced) measurement types. */
export const SUGGESTED_MEASUREMENT_TYPES = [
  "IC50",
  "EC50",
  "CC50",
  "GI50",
  "MIC",
  "MIC90",
  "Ki",
  "Kd",
  "% inhibition",
  "Selectivity index",
  "log10 CFU reduction",
];

export type ColumnKind = "text" | "code" | "enum" | "number" | "date" | "boolean" | "url" | "doi" | "inchikey" | "tags";

export type ColumnDef = {
  /** Canonical header used in templates (snake_case). */
  header: string;
  /** Field name on the parsed record. */
  field: string;
  kind: ColumnKind;
  required: boolean;
  description: string;
  allowed?: readonly string[];
  example?: string;
};

const provenanceColumns: ColumnDef[] = [
  {
    header: "source_type",
    field: "sourceType",
    kind: "enum",
    required: true,
    allowed: SOURCE_TYPES,
    description: "Kind of source the record comes from.",
    example: "DATABASE",
  },
  {
    header: "source_name",
    field: "sourceName",
    kind: "text",
    required: true,
    description: 'Name of the source, e.g. "ChEMBL 35", a journal name, or the depositing lab.',
    example: "ChEMBL 35",
  },
  {
    header: "source_url",
    field: "sourceUrl",
    kind: "url",
    required: false,
    description: "Link to the source record or paper (must start with http:// or https://).",
    example: "https://www.ebi.ac.uk/chembl/",
  },
  {
    header: "doi",
    field: "doi",
    kind: "doi",
    required: false,
    description: 'DOI of the publication, e.g. "10.1021/acs.jmedchem.0c00001" (a https://doi.org/ prefix is removed).',
    example: "10.1234/example.doi",
  },
  {
    header: "citation",
    field: "citation",
    kind: "text",
    required: false,
    description: "Human-readable citation (authors, title, journal, year).",
  },
  {
    header: "license",
    field: "license",
    kind: "text",
    required: false,
    description: 'Licence the data is available under, e.g. "CC BY-SA 3.0" for ChEMBL, or the licence agreement name.',
    example: "CC BY-SA 3.0",
  },
  {
    header: "source_record_id",
    field: "sourceRecordId",
    kind: "text",
    required: false,
    description: "Identifier of the record in the source (e.g. a ChEMBL ID). For assays this is used to de-duplicate.",
    example: "CHEMBL0000000",
  },
];

export const COMPOUND_COLUMNS: ColumnDef[] = [
  {
    header: "code",
    field: "code",
    kind: "code",
    required: true,
    description:
      'Unique compound code, e.g. "ADD-0101". Letters, digits, "-", "_" and "." only (stored upper-case). Re-importing a code updates that compound.',
    example: "ADD-0101",
  },
  { header: "name", field: "name", kind: "text", required: true, description: "Display name of the compound.", example: "Example alkaloid" },
  {
    header: "source_region",
    field: "sourceRegion",
    kind: "text",
    required: true,
    description: 'African country or region shown in filters, e.g. "Kenya" or "West Africa".',
    example: "Kenya",
  },
  {
    header: "country_of_origin",
    field: "countryOfOrigin",
    kind: "text",
    required: false,
    description: "Country where the source material (plant, organism, sample) was collected.",
    example: "Kenya",
  },
  {
    header: "disease_tags",
    field: "diseaseTags",
    kind: "tags",
    required: false,
    allowed: DISEASES.map((d) => d.tag),
    description: 'Disease areas, separated by ";" or ",". Use the tag slugs listed in "Allowed values".',
    example: "malaria; tuberculosis",
  },
  { header: "smiles", field: "smiles", kind: "text", required: false, description: "SMILES string of the structure." },
  {
    header: "inchikey",
    field: "inchikey",
    kind: "inchikey",
    required: false,
    description: "Standard InChIKey (27 characters, e.g. XXXXXXXXXXXXXX-YYYYYYYYYY-Z).",
  },
  { header: "formula", field: "formula", kind: "text", required: false, description: "Molecular formula, e.g. C20H24N2O2." },
  { header: "source_notes", field: "sourceNotes", kind: "text", required: false, description: "Free-text notes about the source material." },
  {
    header: "collection_date",
    field: "collectionDate",
    kind: "date",
    required: false,
    description: "Date the material was collected, as YYYY-MM-DD (Excel date cells are also accepted).",
    example: "2024-03-15",
  },
  {
    header: "abs_permit_ref",
    field: "absPermitRef",
    kind: "text",
    required: false,
    description:
      "Nagoya Protocol / access-and-benefit-sharing permit reference, e.g. an IRCC (ABSCH) identifier or national permit number.",
    example: "ABSCH-IRCC-XX-000000-1",
  },
  ...provenanceColumns,
  {
    header: "is_example",
    field: "isExample",
    kind: "boolean",
    required: false,
    description: "TRUE for fictional/demo rows (removed by `npm run clear-examples`). Leave empty or FALSE for real data.",
    allowed: ["TRUE", "FALSE"],
    example: "FALSE",
  },
];

export const ASSAY_COLUMNS: ColumnDef[] = [
  {
    header: "compound_code",
    field: "compoundCode",
    kind: "code",
    required: true,
    description: "Code of the compound this result belongs to. Must exist in the database or in the Compounds sheet/file.",
    example: "ADD-0101",
  },
  {
    header: "assay_type",
    field: "assayType",
    kind: "text",
    required: true,
    description: 'Kind of assay, e.g. "In vitro growth inhibition", "Cytotoxicity", "Enzyme inhibition".',
    example: "In vitro growth inhibition",
  },
  {
    header: "activity",
    field: "activityLabel",
    kind: "enum",
    required: true,
    allowed: ACTIVITY_LABELS,
    description: "Overall activity call for this result.",
    example: "ACTIVE",
  },
  {
    header: "measurement_type",
    field: "measurementType",
    kind: "text",
    required: false,
    description: `What was measured. Suggested: ${SUGGESTED_MEASUREMENT_TYPES.join(", ")}.`,
    example: "IC50",
  },
  {
    header: "relation",
    field: "relation",
    kind: "enum",
    required: false,
    allowed: RELATIONS,
    description: 'Qualifier for the value: "=" (default when a value is given), "<", ">", "<=", ">=", or "~" (approx.). Requires a value.',
    example: "=",
  },
  { header: "value", field: "resultValue", kind: "number", required: false, description: "Numeric result value (use a dot as decimal separator).", example: "0.42" },
  { header: "units", field: "resultUnit", kind: "text", required: false, description: 'Units of the value, e.g. "µM", "nM", "µg/mL", "%".', example: "µM" },
  { header: "target", field: "target", kind: "text", required: false, description: "Molecular target, enzyme or cell line, e.g. \"HIV-1 reverse transcriptase\"." },
  {
    header: "organism",
    field: "organism",
    kind: "text",
    required: false,
    description: 'Organism tested, e.g. "Plasmodium falciparum 3D7".',
    example: "Plasmodium falciparum",
  },
  { header: "performed_in_country", field: "performedInCountry", kind: "text", required: false, description: "Country where the assay was performed." },
  { header: "reference", field: "reference", kind: "text", required: false, description: "Short reference note (legacy free text)." },
  ...provenanceColumns,
  {
    header: "is_example",
    field: "isExample",
    kind: "boolean",
    required: false,
    description: "TRUE for fictional/demo rows. Leave empty or FALSE for real data.",
    allowed: ["TRUE", "FALSE"],
    example: "FALSE",
  },
];

export function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[^a-z0-9%]/g, "");
}
