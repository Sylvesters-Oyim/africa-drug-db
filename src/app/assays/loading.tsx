export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="skeleton h-10 w-56" />
      <div className="skeleton h-5 w-80 max-w-full" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-96 w-full" />
    </div>
  );
}
