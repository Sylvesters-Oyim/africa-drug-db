import Link from "next/link";
import { NavLink } from "./NavLink";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-blush-300/60 bg-cream/80 backdrop-blur-xl">
      <div className="container-wide flex flex-wrap items-center justify-between gap-3 py-3.5">
        <Link href="/" className="group flex items-center gap-2.5 text-navy">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-navy text-sm font-bold text-white shadow-soft transition group-hover:bg-orange group-hover:text-navy"
          >
            AD
          </span>
          <span className="text-base font-semibold tracking-tight sm:text-lg">
            Africa Drug Discovery <span className="text-navy-muted">DB</span>
          </span>
        </Link>
        <nav
          aria-label="Main"
          className="flex items-center gap-1 rounded-full border border-blush-300/70 bg-white/60 p-1 shadow-soft"
        >
          <NavLink href="/">Home</NavLink>
          <NavLink href="/compounds">Compounds</NavLink>
          <NavLink href="/assays">Assays</NavLink>
        </nav>
      </div>
    </header>
  );
}
