export default function Loading() {
  return (
    <div className="grid gap-8 lg:grid-cols-3" aria-busy="true">
      <div className="space-y-4 lg:col-span-2">
        <div className="aspect-[16/9] animate-pulse rounded-xl bg-slate-200" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-24 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}
