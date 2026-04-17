export function DropCardSkeleton() {
  return (
    <article className="section-card overflow-hidden rounded-[var(--ui-radius-xl)] p-5">
      <div className="animate-pulse space-y-4">
        <header className="flex items-start justify-between gap-4">
          <div className="w-full space-y-2">
            <div className="h-5 w-2/3 rounded-md bg-slate-200" />
            <div className="h-4 w-24 rounded-md bg-slate-200" />
          </div>
          <div className="h-7 w-24 rounded-full bg-indigo-100" />
        </header>

        <div className="h-14 rounded-lg border border-slate-200 bg-slate-100" />

        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 rounded-lg bg-slate-200" />
          <div className="h-10 rounded-lg bg-slate-200" />
        </div>

        <div className="space-y-2 rounded-xl bg-slate-100/80 p-3">
          <div className="h-4 w-36 rounded-md bg-slate-200" />
          <div className="h-3 w-20 rounded-md bg-slate-200" />
          <div className="h-3 w-24 rounded-md bg-slate-200" />
        </div>
      </div>
    </article>
  );
}
