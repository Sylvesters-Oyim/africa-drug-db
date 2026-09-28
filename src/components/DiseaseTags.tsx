import { diseaseLabel } from "@/lib/diseases";

export function DiseaseTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return <span className="text-slate-400">—</span>;
  return (
    <ul className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <li key={tag} className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800">
          {diseaseLabel(tag)}
        </li>
      ))}
    </ul>
  );
}
