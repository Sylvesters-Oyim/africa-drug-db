/** Lightweight SVG science icons for floating decorations. */

type IconProps = { className?: string; title?: string };

export function MoleculeIcon({ className = "h-10 w-10", title }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="18" cy="20" r="6" fill="#F7A13A" />
      <circle cx="46" cy="16" r="5" fill="#A4D09F" />
      <circle cx="40" cy="42" r="7" fill="#25244C" />
      <circle cx="18" cy="46" r="4.5" fill="#69B1A3" />
      <path d="M23 23L41 19M42 21L40 36M34 42L22 45" stroke="#25244C" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function DnaIcon({ className = "h-10 w-10", title }: IconProps) {
  return (
    <svg
      viewBox="0 0 40 64"
      fill="none"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d="M12 4C28 16 12 32 28 48C20 56 12 60 12 60" stroke="#25244C" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 4C12 16 28 32 12 48C20 56 28 60 28 60" stroke="#25244C" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 14h12M13 24h14M14 34h12M16 44h8" stroke="#F7A13A" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function FlaskIcon({ className = "h-10 w-10", title }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 64"
      fill="none"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M18 6h12M20 6v18L8 52a8 8 0 0 0 7 12h18a8 8 0 0 0 7-12L28 24V6"
        stroke="#25244C"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 42h24" stroke="#25244C" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 46c2 8 24 8 26 0L28 24H20L11 46Z" fill="#A4D09F" opacity="0.85" />
      <circle cx="20" cy="50" r="1.8" fill="white" />
      <circle cx="28" cy="52" r="1.4" fill="white" />
      <circle cx="24" cy="47" r="1.2" fill="white" />
    </svg>
  );
}

export function AtomIcon({ className = "h-10 w-10", title }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <ellipse cx="32" cy="32" rx="24" ry="10" stroke="#25244C" strokeWidth="2.5" transform="rotate(0 32 32)" />
      <ellipse cx="32" cy="32" rx="24" ry="10" stroke="#25244C" strokeWidth="2.5" transform="rotate(60 32 32)" />
      <ellipse cx="32" cy="32" rx="24" ry="10" stroke="#25244C" strokeWidth="2.5" transform="rotate(-60 32 32)" />
      <circle cx="32" cy="32" r="5" fill="#F7A13A" />
      <circle cx="54" cy="28" r="3" fill="#69B1A3" />
      <circle cx="14" cy="40" r="3" fill="#A4D09F" />
    </svg>
  );
}

export function GearIcon({ className = "h-10 w-10", title }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d="M26 6h12l2 8 8-3 6 10-7 5 5 7-10 6-3 8H22l-3-8-10-6 5-7-7-5 6-10 8 3 2-8Z" fill="#25244C" />
      <circle cx="32" cy="32" r="8" fill="#FBEAE2" />
      <circle cx="32" cy="32" r="4" fill="#25244C" />
    </svg>
  );
}

/** Small floating icon cluster used beside page titles. */
export function HeaderDecor({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none relative h-28 w-56 ${className}`}>
      <div className="absolute inset-x-6 inset-y-2 rounded-full bg-blush/80" />
      <MoleculeIcon className="absolute left-2 top-4 h-14 w-14 motion-safe:animate-float" />
      <FlaskIcon className="absolute left-[42%] top-1 h-16 w-12 motion-safe:animate-float-slow" />
      <DnaIcon className="absolute right-12 top-6 h-14 w-9 motion-safe:animate-float" />
      <GearIcon className="absolute bottom-0 right-2 h-10 w-10 motion-safe:animate-spin-slow" />
    </div>
  );
}
