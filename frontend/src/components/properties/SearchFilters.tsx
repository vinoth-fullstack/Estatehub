"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextInput } from "@/components/ui/FormControls";
import { LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/format";
import { LocationAutocomplete } from "@/components/properties/LocationAutocomplete";

export interface FilterValues {
  q: string;
  listingType: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  bedrooms: string;
  amenities: string;
  sort: string;
}

export const EMPTY_FILTERS: FilterValues = {
  q: "", listingType: "", propertyType: "", minPrice: "", maxPrice: "", minArea: "", maxArea: "", bedrooms: "", amenities: "", sort: "newest",
};

const AMENITIES = ["Parking", "Lift", "Gym", "Swimming Pool", "Security", "Power Backup", "Balcony", "Pet Friendly"];

export function SearchFilters({ initialValues }: { initialValues: FilterValues; }) {
  const router = useRouter();

  const [values, setValues] = useState<FilterValues>(() => ({ ...EMPTY_FILTERS, ...initialValues }));
  const initialValuesKey = JSON.stringify(initialValues);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues({ ...EMPTY_FILTERS, ...initialValues });
    setError(null);
  }, [initialValuesKey]);

  const update = (field: keyof FilterValues) => (event: { target: { value: string; }; }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  function applyFilters(next: FilterValues) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {

      if (value.trim() && !(key === "sort" && value === "newest")) params.set(key, value.trim());
    }
    const query = params.toString();
    startTransition(() => router.push(query ? `/properties?${query}` : "/properties"));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const min = Number(values.minPrice);
    const max = Number(values.maxPrice);
    const minArea = Number(values.minArea);
    const maxArea = Number(values.maxArea);
    if (values.q.trim() && values.q.trim().length < 2) return setError("Enter at least 2 characters to search by location.");
    if (values.minPrice && values.maxPrice && min > max) return setError("Minimum budget cannot be higher than maximum budget.");
    if (values.minArea && values.maxArea && minArea > maxArea) return setError("Minimum area cannot be larger than maximum area.");
    setError(null);
    applyFilters(values);
  }

  function handleReset() {
    setValues(EMPTY_FILTERS);
    setError(null);
    applyFilters(EMPTY_FILTERS);
  }

  const activeFilters = (Object.entries(values) as [keyof FilterValues, string][]).filter(([key, value]) => value.trim() && !(key === "sort" && value === "newest"));

  return (
    <>

      <form onSubmit={handleSubmit} className={`${isPending ? "hidden" : ""} rounded-xl border border-slate-200 bg-white p-4 shadow-sm`} aria-label="Search filters" aria-busy={isPending}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Field label="City, locality or property" htmlFor="filter-q">
              <LocationAutocomplete id="filter-q" value={values.q} onChange={(q) => setValues((current) => ({ ...current, q }))} placeholder="Try Whitefield, Bengaluru or a society" />
            </Field>
          </div>
          <Field label="Buy or rent" htmlFor="filter-listing">
            <SelectInput id="filter-listing" value={values.listingType} onChange={update("listingType")}>
              <option value="">Buy or rent</option>
              {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Property type" htmlFor="filter-type">
            <SelectInput id="filter-type" value={values.propertyType} onChange={update("propertyType")}>
              <option value="">All types</option>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Min budget (₹)" htmlFor="filter-min">
            <TextInput id="filter-min" type="number" min={0} inputMode="numeric" value={values.minPrice} onChange={update("minPrice")} placeholder="0" />
          </Field>
          <Field label="Max budget (₹)" htmlFor="filter-max">
            <TextInput id="filter-max" type="number" min={0} inputMode="numeric" value={values.maxPrice} onChange={update("maxPrice")} placeholder="No limit" />
          </Field>
          <Field label="Min area (sq ft)" htmlFor="filter-min-area">
            <TextInput id="filter-min-area" type="number" min={0} inputMode="numeric" value={values.minArea} onChange={update("minArea")} placeholder="Any" />
          </Field>
          <Field label="Max area (sq ft)" htmlFor="filter-max-area">
            <TextInput id="filter-max-area" type="number" min={0} inputMode="numeric" value={values.maxArea} onChange={update("maxArea")} placeholder="Any" />
          </Field>
          <Field label="Bedrooms" htmlFor="filter-beds">
            <SelectInput id="filter-beds" value={values.bedrooms} onChange={update("bedrooms")}>
              <option value="">Any</option>
              {[1, 2, 3, 4].map((count) => (
                <option key={count} value={count}>{count} BHK</option>
              ))}
              <option value="5">5+ BHK</option>
            </SelectInput>
          </Field>
          <Field label="Sort by" htmlFor="filter-sort">
            <SelectInput id="filter-sort" value={values.sort} onChange={update("sort")}>
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </SelectInput>
          </Field>
        </div>

        <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <summary className="cursor-pointer select-none text-sm font-semibold text-slate-700">Amenities <span className="ml-1 font-normal text-slate-500">{values.amenities ? `(${values.amenities.split(",").length} selected)` : "(optional)"}</span></summary>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{AMENITIES.map((amenity) => {
            const selected = values.amenities.split(",").filter(Boolean).includes(amenity);
            return <label key={amenity} className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700"><input type="checkbox" className="h-4 w-4 accent-teal-700" checked={selected} onChange={() => {
              const next = new Set(values.amenities.split(",").filter(Boolean));
              if (next.has(amenity)) next.delete(amenity); else next.add(amenity);
              setValues((current) => ({ ...current, amenities: [...next].join(",") }));
            }} />{amenity}</label>;
          })}</div>
        </details>

        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

        {activeFilters.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applied</span>
          {activeFilters.flatMap(([key, value]) => key === "amenities" ? value.split(",").filter(Boolean).map((item) => [key, item] as [keyof FilterValues, string]) : [[key, value] as [keyof FilterValues, string]]).map(([key, value]) => <button type="button" key={`${key}-${value}`} onClick={() => setValues((current) => ({ ...current, [key]: key === "sort" ? "newest" : key === "amenities" ? current.amenities.split(",").filter((item) => item !== value).join(",") : "" }))} className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800 hover:bg-teal-100">
            {key === "q" ? value : key === "listingType" ? LISTING_TYPE_LABELS[value as keyof typeof LISTING_TYPE_LABELS] : key === "propertyType" ? PROPERTY_TYPE_LABELS[value as keyof typeof PROPERTY_TYPE_LABELS] : key === "bedrooms" ? `${value}+ BHK` : key === "minPrice" ? `Min ₹${Number(value).toLocaleString("en-IN")}` : key === "maxPrice" ? `Max ₹${Number(value).toLocaleString("en-IN")}` : key === "minArea" ? `From ${value} sq ft` : key === "maxArea" ? `Up to ${value} sq ft` : key === "amenities" ? value : `Sort: ${value === "price_asc" ? "lowest price" : "highest price"}`} <span aria-hidden>×</span>
          </button>)}
        </div>}

        <div className="mt-4 flex gap-3">
          <Button type="submit" loading={isPending}>Search</Button>
          <Button type="button" variant="secondary" onClick={handleReset} disabled={isPending}>Reset</Button>
        </div>
      </form>
    </>
  );
}
