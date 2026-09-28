"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { primaryButtonClass } from "@/components/form";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-navy">Something went wrong</h1>
      <p className="mt-3 text-navy-muted">
        We could not load this page. If you are running locally, check that the database is running and that
        DATABASE_URL is set.
      </p>
      <button type="button" onClick={() => retry()} className={`${primaryButtonClass} mt-6`}>
        Try again
      </button>
    </div>
  );
}
