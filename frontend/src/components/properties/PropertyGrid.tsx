import type { PropertyCardData } from "@/lib/types";
import { PropertyCard } from "./PropertyCard";

export function PropertyGrid({ properties }: { properties: PropertyCardData[]; }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}

export function PropertyGridSkeleton({ count = 8 }: { count?: number; }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading properties">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="aspect-[4/3] animate-pulse bg-slate-200" />
          <div className="space-y-2 p-4">
            <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
