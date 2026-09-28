"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        active ? "bg-navy text-white shadow-sm" : "text-navy-muted hover:bg-blush/70 hover:text-navy"
      }`}
    >
      {children}
    </Link>
  );
}
