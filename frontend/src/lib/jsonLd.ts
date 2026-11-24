import { SITE_URL } from "./config";
import { propertyPath } from "./slug";
import type { PropertyDetailData } from "./types";

export function buildPropertyJsonLd(property: PropertyDetailData) {
  const url = `${SITE_URL}${propertyPath(property.id, property.title)}`;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url,
    datePosted: property.createdAt,
    dateModified: property.updatedAt,
    image: property.images.map((image) => image.url),
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
    about: {
      "@type": "Residence",
      numberOfRooms: property.bedrooms || undefined,
      floorSize: { "@type": "QuantitativeValue", value: property.areaSqft, unitCode: "FTK" },
      address: {
        "@type": "PostalAddress",
        streetAddress: property.addressLine,
        addressLocality: property.locality,
        addressRegion: property.state,
        postalCode: property.pincode,
        addressCountry: "IN",
      },
    },
  };
}
