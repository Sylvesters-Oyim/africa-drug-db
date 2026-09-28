import Link from "next/link";
import { primaryButtonClass } from "@/components/form";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-lg px-6 py-16 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-orange-800">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy">Not found</h1>
      <p className="mt-3 text-navy-muted">The page or record you are looking for does not exist.</p>
      <div className="mt-6">
        <Link href="/compounds" className={primaryButtonClass}>
          Browse compounds
        </Link>
      </div>
    </div>
  );
}
