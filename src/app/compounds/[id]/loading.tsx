export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton h-10 w-72 max-w-full" />
      <div className="skeleton h-48 w-full" />
      <div className="skeleton h-64 w-full" />
    </div>
  );
}
