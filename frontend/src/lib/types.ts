export type PropertyType = "apartment" | "house" | "villa" | "plot" | "commercial";
export type ListingType = "sale" | "rent";
export type SortOption = "newest" | "price_asc" | "price_desc";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface PropertyCardData {
  id: number;
  title: string;
  propertyType: PropertyType;
  listingType: ListingType;
  price: number;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  locality: string;
  city: string;
  state: string;
  status: "active" | "inactive";
  createdAt: string;
  coverImageUrl: string | null;
}

export interface PropertyImage {
  id: number;
  url: string;
  position: number;
}

export interface PropertyDetailData extends PropertyCardData {
  description: string;
  addressLine: string;
  pincode: string;
  amenities: string[];
  updatedAt: string;
  images: PropertyImage[];
  owner: { id: number; name: string; };
  isOwner: boolean;
}

export interface PageMeta {
  page: number | null;
  limit: number;
  total: number | null;
  totalPages: number | null;
  hasNextPage: boolean;
  nextCursor: string | null;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface ReceivedInquiry {
  id: number;
  propertyId: number;
  propertyTitle: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  status: "pending" | "replied" | "accepted" | "rejected";
  locality: string;
  city: string;
  price: number;
  coverImageUrl: string | null;
  requesterAvatarUrl: string | null;
}

export interface SentInquiry {
  id: number;
  propertyId: number;
  propertyTitle: string;
  message: string;
  createdAt: string;
  status: "pending" | "replied" | "accepted" | "rejected";
  locality: string;
  city: string;
  price: number;
  coverImageUrl: string | null;
  ownerId: number;
  ownerName: string;
  ownerAvatarUrl: string | null;
}

export interface PropertyFormValues {
  title: string;
  description: string;
  propertyType: PropertyType;
  listingType: ListingType;
  price: string;
  bedrooms: string;
  bathrooms: string;
  areaSqft: string;
  addressLine: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  amenities: string[];
}
