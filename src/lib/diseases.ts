/**
 * Canonical disease tags used on compounds, with human-readable labels.
 * Tags are stored as lowercase slugs in the database (Compound.diseaseTags).
 */
export const DISEASES = [
  { tag: "malaria", label: "Malaria" },
  { tag: "tuberculosis", label: "Tuberculosis" },
  { tag: "hiv", label: "HIV" },
  { tag: "sleeping-sickness", label: "Sleeping sickness (HAT)" },
  { tag: "schistosomiasis", label: "Schistosomiasis" },
  { tag: "leishmaniasis", label: "Leishmaniasis" },
  { tag: "buruli-ulcer", label: "Buruli ulcer" },
] as const;

export function diseaseLabel(tag: string): string {
  return DISEASES.find((d) => d.tag === tag)?.label ?? tag;
}
