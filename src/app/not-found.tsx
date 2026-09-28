import Link from "next/link";
import { primaryButtonClass } from "@/components/form";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm font-semibold text-teal-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Not found</h1>
      <p className="mt-3 text-slate-600">The page or record you are looking for does not exist.</p>
      <div className="mt-6">
        <Link href="/compounds" className={primaryButtonClass}>
          Browse compounds
        </Link>
      </div>
    </div>
  );
}
