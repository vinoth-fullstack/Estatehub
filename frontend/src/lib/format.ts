import type { ListingType, PropertyType } from "./types";

const rupees = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatPrice(price: number, listingType: ListingType): string {
  if (listingType === "rent") return `₹${rupees.format(price)} / month`;
  if (price >= 10_000_000) return `₹${trimZeros(price / 10_000_000)} Cr`;
  if (price >= 100_000) return `₹${trimZeros(price / 100_000)} Lakh`;
  return `₹${rupees.format(price)}`;
}

export const formatRupees = (price: number) => `₹${rupees.format(price)}`;

const trimZeros = (value: number) => value.toFixed(2).replace(/\.?0+$/, "");

export const formatArea = (areaSqft: number) => `${rupees.format(areaSqft)} sq ft`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment",
  house: "Independent House",
  villa: "Villa",
  plot: "Plot",
  commercial: "Commercial",
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = { sale: "For Sale", rent: "For Rent" };
