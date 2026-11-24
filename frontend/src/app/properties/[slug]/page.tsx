import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { ImageGallery } from "@/components/properties/ImageGallery";
import { InquiryForm } from "@/components/properties/InquiryForm";
import { SimilarProperties, SimilarPropertiesSkeleton } from "@/components/properties/SimilarProperties";
import { ApiError } from "@/lib/apiError";
import { SITE_URL } from "@/lib/config";
import { formatArea, formatDate, formatPrice, formatRupees, LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/format";
import { buildPropertyJsonLd } from "@/lib/jsonLd";
import { parsePropertyId, propertyPath, propertySlug } from "@/lib/slug";
import { serverFetch } from "@/lib/serverApi";
import type { PropertyDetailData } from "@/lib/types";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type PageProps = { params: Promise<{ slug: string; }>; };

async function loadProperty(slug: string): Promise<PropertyDetailData> {
  const id = parsePropertyId(slug);
  if (!id) notFound();
  try {
    const response = await serverFetch<{ data: PropertyDetailData; }>(`/api/properties/${id}`, { revalidate: 300, tags: [`property-${id}`] });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let property: PropertyDetailData;
  try {
    property = await loadProperty(slug);
  } catch {
    return { title: "Property not found", robots: { index: false } };
  }

  const title = `${property.title}`;
  const description = `${formatPrice(property.price, property.listingType)} - ${property.description}`.slice(0, 160);
  const canonical = propertyPath(property.id, property.title);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title, description, url: `${SITE_URL}${canonical}`, type: "website",
      images: property.images.slice(0, 4).map((image) => ({ url: image.url, alt: property.title })),
    },
    twitter: { card: property.images.length ? "summary_large_image" : "summary", title, description },
  };
}

function Spec({ label, value }: { label: string; value: string; }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const property = await loadProperty(slug);

  if (slug !== propertySlug(property.id, property.title)) permanentRedirect(propertyPath(property.id, property.title));

  const jsonLd = JSON.stringify(buildPropertyJsonLd(property)).replace(/</g, "\\u003c");

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ImageGallery images={property.images} title={property.title} />

          <header>
            <p className="text-sm font-medium text-teal-700">
              {LISTING_TYPE_LABELS[property.listingType]} · {PROPERTY_TYPE_LABELS[property.propertyType]}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{property.title}</h1>
            <p className="mt-1 text-slate-600">{property.addressLine}, {property.locality}, {property.city}, {property.state} - {property.pincode}</p>
            <p className="mt-3 text-3xl font-extrabold text-teal-800" title={formatRupees(property.price)}>{formatPrice(property.price, property.listingType)}</p>
          </header>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {property.propertyType !== "plot" && property.bedrooms > 0 && <Spec label="Bedrooms" value={String(property.bedrooms)} />}
            {property.propertyType !== "plot" && property.bathrooms > 0 && <Spec label="Bathrooms" value={String(property.bathrooms)} />}
            <Spec label="Area" value={formatArea(property.areaSqft)} />
            <Spec label="Posted" value={formatDate(property.createdAt)} />
          </dl>

          <section>
            <h2 className="mb-2 text-lg font-bold">About this property</h2>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">{property.description}</p>
          </section>

          {property.amenities.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-bold">Amenities</h2>
              <ul className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <li key={amenity} className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-800">{amenity}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <InquiryForm propertyId={property.id} ownerName={property.owner.name} />
        </aside>
      </div>

      <Suspense fallback={<SimilarPropertiesSkeleton />}>
        <SimilarProperties propertyId={property.id} />
      </Suspense>
    </article>
  );
}
