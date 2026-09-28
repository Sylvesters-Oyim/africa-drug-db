export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="skeleton h-10 w-56" />
      <div className="skeleton h-5 w-80 max-w-full" />
      <div className="skeleton h-28 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-40" />
        ))}
      </div>
    </div>
  );
}
