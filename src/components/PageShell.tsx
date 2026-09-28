/** Wrapper that applies the page-enter animation. */
export function PageShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`motion-safe:animate-page-in space-y-8 ${className}`}>{children}</div>;
}
