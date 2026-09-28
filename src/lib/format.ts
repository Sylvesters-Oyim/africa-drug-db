function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toPrecision(3).replace(/\.?0+$/, "");
}

export function formatResult(value: number | null, unit: string | null): string {
  if (value === null) return "—";
  const formatted = formatNumber(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

/** e.g. "IC50 = 0.42 µM", "CC50 > 100 µM", or the legacy "0.42 µM (IC50)". */
export function formatMeasurement(a: {
  measurementType?: string | null;
  relation?: string | null;
  resultValue: number | null;
  resultUnit: string | null;
}): string {
  const rel = a.relation && a.relation !== "=" ? a.relation : null;
  if (a.resultValue === null) return a.measurementType ?? "—";
  const value = `${formatNumber(a.resultValue)}${a.resultUnit ? ` ${a.resultUnit}` : ""}`;
  if (a.measurementType) return `${a.measurementType} ${rel ?? "="} ${value}`;
  return rel ? `${rel} ${value}` : value;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

/** Date-only values (e.g. collection dates) are stored at UTC midnight. */
export function formatDay(date: Date): string {
  return date.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  LITERATURE: "Literature",
  DATABASE: "Database",
  LAB_DEPOSIT: "Lab deposit",
  OTHER: "Other",
};
