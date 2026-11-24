import { serverFetch } from "@/lib/serverApi";
import type { PropertyCardData } from "@/lib/types";
import { PropertyGrid } from "./PropertyGrid";

export async function SimilarProperties({ propertyId }: { propertyId: number; }) {
  let properties: PropertyCardData[] = [];
  try {
    const response = await serverFetch<{ data: PropertyCardData[]; }>(`/api/properties/${propertyId}/similar`, { revalidate: 300 });
    properties = response.data;
  } catch {
    return null;
  }
  if (properties.length === 0) return null;

  return (
    <section aria-labelledby="similar-heading" className="mt-12">
      <h2 id="similar-heading" className="mb-4 text-xl font-bold text-slate-900">Similar properties</h2>
      <PropertyGrid properties={properties} />
    </section>
  );
}

export function SimilarPropertiesSkeleton() {
  return <div className="mt-12 h-64 animate-pulse rounded-xl bg-slate-100" aria-hidden />;
}
