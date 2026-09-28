export function formatResult(value: number | null, unit: string | null): string {
  if (value === null) return "—";
  const formatted = Number.isInteger(value) ? String(value) : value.toPrecision(3).replace(/\.?0+$/, "");
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}
