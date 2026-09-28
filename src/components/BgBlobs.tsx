/** Soft salmon circles matching the reference illustration. Decorative only. */
export function BgBlobs({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -right-24 -top-28 h-[28rem] w-[28rem] rounded-full bg-blush opacity-90 blur-[2px] motion-safe:animate-drift" />
      <div className="absolute -left-32 top-1/3 h-[22rem] w-[22rem] rounded-full bg-blush/80 blur-[1px] motion-safe:animate-float-slow" />
      <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-mint/25 blur-sm motion-safe:animate-float" />
      <div className="absolute left-1/3 top-16 h-40 w-40 rounded-full bg-orange/10 blur-md" />
    </div>
  );
}
