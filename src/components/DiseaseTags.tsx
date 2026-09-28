import { diseaseLabel } from "@/lib/diseases";

export function DiseaseTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return <span className="text-navy-muted/60">—</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800 ring-1 ring-inset ring-teal/30"
        >
          {diseaseLabel(tag)}
        </li>
      ))}
    </ul>
  );
}
