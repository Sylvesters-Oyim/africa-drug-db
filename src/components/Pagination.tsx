import Link from "next/link";
import { buildQuery } from "@/lib/search-params";

type Props = {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  /** Current filter values to preserve when changing pages. */
  query: Record<string, string | undefined>;
};

export function Pagination({ basePath, page, pageSize, total, query }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const linkClass =
    "rounded-full border border-blush-300 bg-white/90 px-4 py-2 text-sm font-semibold text-navy shadow-soft transition hover:-translate-y-0.5 hover:bg-blush/50";
  const disabledClass = "rounded-full border border-blush-300/50 px-4 py-2 text-sm font-medium text-navy-muted/50";

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-2">
      {page > 1 ? (
        <Link className={linkClass} href={`${basePath}${buildQuery({ ...query, page: page - 1 })}`}>
          Previous
        </Link>
      ) : (
        <span className={disabledClass}>Previous</span>
      )}
      <span className="text-sm font-medium text-navy-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link className={linkClass} href={`${basePath}${buildQuery({ ...query, page: page + 1 })}`}>
          Next
        </Link>
      ) : (
        <span className={disabledClass}>Next</span>
      )}
    </nav>
  );
}
