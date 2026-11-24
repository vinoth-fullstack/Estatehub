import Link from "next/link";
import { formatArea, formatPrice, LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/format";
import { propertyPath } from "@/lib/slug";
import type { PropertyCardData } from "@/lib/types";

function ImagePlaceholder({ label }: { label: string; }) {
  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-teal-50 to-slate-200 text-slate-400">
      <div className="text-center">
        <svg className="mx-auto h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6" />
        </svg>
        <span className="mt-1 block text-xs">{label}</span>
      </div>
    </div>
  );
}

export function PropertyCard({ property }: { property: PropertyCardData; }) {
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType];
  const hasRooms = property.bedrooms > 0;

  return (
    <Link
      href={propertyPath(property.id, property.title)}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {property.coverImageUrl ? (
          <img
            src={property.coverImageUrl}
            alt={property.title}
            loading="lazy"
            width={640}
            height={480}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder label={typeLabel} />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-teal-800 shadow">
          {LISTING_TYPE_LABELS[property.listingType]}
        </span>
        {property.status === "inactive" && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white">Inactive</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-lg font-bold text-slate-900">{formatPrice(property.price, property.listingType)}</p>
        <h3 className="line-clamp-2 text-sm font-medium text-slate-700 group-hover:text-teal-700">{property.title}</h3>
        <p className="text-xs text-slate-500">
          {property.locality}, {property.city}
        </p>
        <p className="mt-auto pt-2 text-xs text-slate-600">
          {typeLabel} · {hasRooms ? `${property.bedrooms} bed · ${property.bathrooms} bath · ` : ""}
          {formatArea(property.areaSqft)}
        </p>
      </div>
    </Link>
  );
}
