export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="skeleton h-10 w-64" />
      <div className="skeleton h-5 w-96 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
      </div>
      <div className="skeleton h-64 w-full" />
    </div>
  );
}
