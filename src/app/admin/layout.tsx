import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { isAdminConfigured } from "@/lib/admin/auth";

// Admin pages depend on env + cookies at request time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!isAdminConfigured()) {
    return (
      <PageShell>
        <section className="card mx-auto max-w-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-navy">Admin is not configured</h1>
          <p className="mt-3 text-navy-muted">
            Set the <code className="rounded bg-navy/5 px-1.5 py-0.5 font-mono text-sm">ADMIN_PASSWORD</code> environment
            variable (and redeploy) to enable the admin area. Until then no admin actions are available.
          </p>
        </section>
      </PageShell>
    );
  }
  return <PageShell>{children}</PageShell>;
}
