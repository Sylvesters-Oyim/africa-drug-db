/** Helpers for reading Next.js `searchParams` values safely. */

export type SearchParams = Record<string, string | string[] | undefined>;

/** Returns the first value of a search param, trimmed, or undefined if empty. */
export function getParam(params: SearchParams, key: string): string | undefined {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Parses a 1-based page number from search params. */
export function getPage(params: SearchParams): number {
  const n = Number.parseInt(getParam(params, "page") ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Builds a query string from the given values, omitting empty ones. */
export function buildQuery(values: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
