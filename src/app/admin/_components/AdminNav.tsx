import Link from "next/link";
import { logoutAction } from "../actions";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/compounds", label: "Compounds" },
  { href: "/admin/assays", label: "Assays" },
];

export function AdminNav({ current }: { current: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-blush-300/70 bg-white/60 p-1.5 pl-4 shadow-soft">
      <p className="flex items-center gap-2 text-sm font-semibold text-navy">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-orange" />
        Admin
      </p>
      <nav aria-label="Admin" className="flex flex-wrap items-center gap-1">
        {links.map((l) => {
          const active = current === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active ? "bg-navy text-white shadow-soft" : "text-navy-muted hover:bg-blush/60 hover:text-navy"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
          >
            Log out
          </button>
        </form>
      </nav>
    </div>
  );
}

export function AdminTitle({ title, description, children }: { title: string; description?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-navy-muted">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function Notice({ tone = "mint", children }: { tone?: "mint" | "orange"; children: React.ReactNode }) {
  const cls = tone === "mint" ? "border-mint/60 bg-mint-100 text-mint-800" : "border-orange/40 bg-orange-100/90 text-orange-800";
  return (
    <p role="status" className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${cls}`}>
      {children}
    </p>
  );
}

export { ExampleBadge } from "@/components/ExampleBadge";
