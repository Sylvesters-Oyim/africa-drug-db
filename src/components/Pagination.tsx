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
    "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50";
  const disabledClass = "rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-400";

  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-2">
      {page > 1 ? (
        <Link className={linkClass} href={`${basePath}${buildQuery({ ...query, page: page - 1 })}`}>
          Previous
        </Link>
      ) : (
        <span className={disabledClass}>Previous</span>
      )}
      <span className="text-sm text-slate-600">
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
