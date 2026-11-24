import { z } from "zod";

export const PROPERTY_TYPES = ["apartment", "house", "villa", "plot", "commercial"] as const;
export const LISTING_TYPES = ["sale", "rent"] as const;
export const SORT_OPTIONS = ["newest", "price_asc", "price_desc"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type ListingType = (typeof LISTING_TYPES)[number];
export type SortOption = (typeof SORT_OPTIONS)[number];

const propertyFields = z.object({
  title: z.string().trim().min(10, "Title must be at least 10 characters").max(150),
  description: z.string().trim().min(30, "Description must be at least 30 characters").max(5000),
  propertyType: z.enum(PROPERTY_TYPES),
  listingType: z.enum(LISTING_TYPES),
  price: z.number().int("Price must be a whole number").positive("Price must be greater than 0"),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  areaSqft: z.number().int().min(50, "Area must be at least 50 sq ft").max(1_000_000),
  addressLine: z.string().trim().min(5, "Address must be at least 5 characters").max(255),
  locality: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  amenities: z.array(z.string().trim().min(1).max(40)).max(20),
});

export const createPropertySchema = propertyFields.extend({
  bedrooms: propertyFields.shape.bedrooms.default(0),
  bathrooms: propertyFields.shape.bathrooms.default(0),
  amenities: propertyFields.shape.amenities.default([]),
});

export const updatePropertySchema = propertyFields
  .partial()
  .extend({ status: z.enum(["active", "inactive"]).optional() })
  .refine((body) => Object.keys(body).length > 0, { message: "Provide at least one field to update" });

export const propertyIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const propertyImageParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive(),
});

export const searchPropertiesQuerySchema = z
  .object({
    q: z.string().trim().min(2, "Search text must be at least 2 characters").max(100).optional(),
    listingType: z.enum(LISTING_TYPES).optional(),
    propertyType: z.enum(PROPERTY_TYPES).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    minArea: z.coerce.number().int().min(0).max(1_000_000).optional(),
    maxArea: z.coerce.number().int().min(0).max(1_000_000).optional(),
    bedrooms: z.coerce.number().int().min(0).max(10).optional(),
    amenities: z.string().trim().max(300).optional(),
    sort: z.enum(SORT_OPTIONS).default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    cursor: z.string().max(300).optional(),
  })
  .refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
    message: "minPrice cannot be greater than maxPrice",
    path: ["minPrice"],
  })
  .refine((query) => query.minArea === undefined || query.maxArea === undefined || query.minArea <= query.maxArea, {
    message: "minArea cannot be greater than maxArea",
    path: ["minArea"],
  });

export const sitemapQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(5000).default(1000),
});

export const suggestionsQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type SearchPropertiesQuery = z.infer<typeof searchPropertiesQuerySchema>;
