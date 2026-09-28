import Link from "next/link";
import { NavLink } from "./NavLink";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-slate-900">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-700 text-sm font-bold text-white"
          >
            AD
          </span>
          <span className="font-semibold tracking-tight">Africa Drug Discovery DB</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/compounds">Compounds</NavLink>
          <NavLink href="/assays">Assays</NavLink>
        </nav>
      </div>
    </header>
  );
}
