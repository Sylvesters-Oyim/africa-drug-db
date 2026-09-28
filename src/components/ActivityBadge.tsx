import type { ActivityLabel } from "@/generated/prisma/enums";

const styles: Record<ActivityLabel, string> = {
  ACTIVE: "bg-mint-100 text-mint-800 ring-mint/50",
  INACTIVE: "bg-blush/60 text-navy-muted ring-blush-300",
  INCONCLUSIVE: "bg-orange-100 text-orange-800 ring-orange/40",
};

const labels: Record<ActivityLabel, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  INCONCLUSIVE: "Inconclusive",
};

export function ActivityBadge({ label }: { label: ActivityLabel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[label]}`}
    >
      {labels[label]}
    </span>
  );
}

export const ACTIVITY_LABEL_OPTIONS = Object.entries(labels).map(([value, label]) => ({
  value: value as ActivityLabel,
  label,
}));
