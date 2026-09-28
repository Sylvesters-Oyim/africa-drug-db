import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/auth";
import { LoginForm } from "../_components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <section className="card mx-auto w-full max-w-md p-7 sm:p-9">
      <p className="inline-flex items-center gap-2 rounded-full bg-orange/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-800">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-orange" />
        Restricted
      </p>
      <h1 className="mt-4 text-2xl font-bold text-navy">Admin sign in</h1>
      <p className="mt-2 text-sm text-navy-muted">Load and curate compound and assay data. Sessions last 12 hours.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </section>
  );
}
