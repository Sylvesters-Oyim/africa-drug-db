import { HeaderDecor } from "./ScienceIcons";

export function PageHeader({ title, description }: { title: string; description?: React.ReactNode }) {
  return (
    <div className="reveal flex items-center justify-between gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl lg:text-5xl">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl text-base text-navy-muted sm:text-lg">{description}</p> : null}
      </div>
      <HeaderDecor className="hidden shrink-0 md:block" />
    </div>
  );
}
