import { PropertyGridSkeleton } from "@/components/properties/PropertyGrid";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
      <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
      <PropertyGridSkeleton count={12} />
    </div>
  );
}
