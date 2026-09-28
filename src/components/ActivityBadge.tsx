import type { ActivityLabel } from "@/generated/prisma/enums";

const styles: Record<ActivityLabel, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-800 ring-emerald-600/30",
  INACTIVE: "bg-slate-100 text-slate-700 ring-slate-500/30",
  INCONCLUSIVE: "bg-amber-50 text-amber-800 ring-amber-600/30",
};

const labels: Record<ActivityLabel, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  INCONCLUSIVE: "Inconclusive",
};

export function ActivityBadge({ label }: { label: ActivityLabel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[label]}`}
    >
      {labels[label]}
    </span>
  );
}

export const ACTIVITY_LABEL_OPTIONS = Object.entries(labels).map(([value, label]) => ({
  value: value as ActivityLabel,
  label,
}));
