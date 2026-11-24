import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PropertyGrid, PropertyGridSkeleton } from "@/components/properties/PropertyGrid";
import { SearchFilters, type FilterValues } from "@/components/properties/SearchFilters";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ApiError } from "@/lib/apiError";
import { pickFilterParams, type RawSearchParams } from "@/lib/searchParams";
import { serverFetch } from "@/lib/serverApi";
import type { Paginated, PropertyCardData } from "@/lib/types";

type PageProps = { searchParams: Promise<RawSearchParams>; };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const q = pickFilterParams(await searchParams).get("q");
  return {
    title: q ? `Properties in ${q}` : "Browse properties for sale and rent",
    description: "Search apartments, houses, villas, plots and commercial properties by location, budget and bedrooms.",
    alternates: { canonical: "/properties" },
  };
}

async function Results({ params }: { params: URLSearchParams; }) {
  const page = Number(params.get("page") ?? 1);
  params.set("limit", "12");

  let result: Paginated<PropertyCardData>;
  try {
    result = await serverFetch<Paginated<PropertyCardData>>(`/api/properties?${params}`, { revalidate: 30 });
  } catch (error) {

    if (error instanceof ApiError && error.status === 400) {
      return <EmptyState title="Those filters are not valid" message={error.message} action={<Link href="/properties" className={buttonClasses()}>Clear filters</Link>} />;
    }
    throw error;
  }

  if (result.data.length === 0) {
    return <EmptyState title="No properties found" message="Try a different location or widen your budget." action={<Link href="/properties" className={buttonClasses()}>Clear filters</Link>} />;
  }

  const buildHref = (target: number) => {
    const next = new URLSearchParams(params);
    next.delete("limit");
    if (target > 1) next.set("page", String(target)); else next.delete("page");
    const query = next.toString();
    return query ? `/properties?${query}` : "/properties";
  };

  return (
    <>
      <p className="mb-4 text-sm text-slate-600" aria-live="polite">
        {result.meta.total?.toLocaleString("en-IN")} {result.meta.total === 1 ? "property" : "properties"} found
      </p>
      <PropertyGrid properties={result.data} />
      <Pagination currentPage={page} totalPages={result.meta.totalPages ?? 1} buildHref={buildHref} />
    </>
  );
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params = pickFilterParams(await searchParams);

  const initialFilters: FilterValues = {
    q: params.get("q") ?? "",
    listingType: params.get("listingType") ?? "",
    propertyType: params.get("propertyType") ?? "",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    minArea: params.get("minArea") ?? "",
    maxArea: params.get("maxArea") ?? "",
    bedrooms: params.get("bedrooms") ?? "",
    amenities: params.get("amenities") ?? "",
    sort: params.get("sort") ?? "newest",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Properties for sale and rent</h1>
      <SearchFilters initialValues={initialFilters} />

      <Suspense key={params.toString()} fallback={<PropertyGridSkeleton count={12} />}>
        <Results params={params} />
      </Suspense>
    </div>
  );
}
