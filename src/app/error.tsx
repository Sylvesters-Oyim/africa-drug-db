"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Something went wrong</h1>
      <p className="mt-3 text-slate-600">
        We could not load this page. If you are running locally, check that the database is running and that
        DATABASE_URL is set.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
      >
        Try again
      </button>
    </div>
  );
}
