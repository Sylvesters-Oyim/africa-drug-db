export function PageHeader({ title, description }: { title: string; description?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {description ? <p className="mt-2 max-w-3xl text-slate-600">{description}</p> : null}
    </div>
  );
}
