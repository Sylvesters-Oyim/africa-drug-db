export function ExampleBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Fictional example record: not real data"
      className={`inline-flex shrink-0 items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800 ring-1 ring-inset ring-orange/40 ${className}`}
    >
      Example
    </span>
  );
}
