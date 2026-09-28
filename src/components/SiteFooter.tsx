import { MoleculeIcon } from "./ScienceIcons";

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto bg-navy text-cream">
      <div className="container-wide flex flex-col gap-3 py-8 text-sm text-cream/85 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-3 font-semibold text-cream">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream">
            <MoleculeIcon className="h-6 w-6" />
          </span>
          &copy; {new Date().getFullYear()} Africa Drug Discovery Database
        </p>
        <p>Each record lists its source and licence. Check them before reusing the data.</p>
      </div>
    </footer>
  );
}
