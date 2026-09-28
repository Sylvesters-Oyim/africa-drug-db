import { CountUp } from "./CountUp";

export function StatCard({
  label,
  value,
  accent,
  delay = 0,
}: {
  label: string;
  value: number;
  accent: "orange" | "mint" | "teal";
  delay?: number;
}) {
  const accents = {
    orange: "from-orange/25 via-white/80 to-white",
    mint: "from-mint/35 via-white/80 to-white",
    teal: "from-teal/30 via-white/80 to-white",
  };
  const dots = {
    orange: "bg-orange",
    mint: "bg-mint-800",
    teal: "bg-teal-800",
  };

  return (
    <div
      className={`reveal card lift relative overflow-hidden bg-gradient-to-br p-4 sm:p-6 ${accents[accent]}`}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      <span
        aria-hidden="true"
        className={`absolute right-3 top-3 h-2.5 sm:right-4 sm:top-4 w-2.5 rounded-full ${dots[accent]}`}
      />
      <p className="text-xs font-semibold text-navy-muted sm:text-sm">{label}</p>
      <p className="mt-2 text-3xl font-bold sm:text-5xl tracking-tight text-navy">
        <CountUp value={value} />
      </p>
    </div>
  );
}
