"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestionsQuerySchema = exports.sitemapQuerySchema = exports.searchPropertiesQuerySchema = exports.propertyImageParamSchema = exports.propertyIdParamSchema = exports.updatePropertySchema = exports.createPropertySchema = exports.SORT_OPTIONS = exports.LISTING_TYPES = exports.PROPERTY_TYPES = void 0;
const zod_1 = require("zod");
exports.PROPERTY_TYPES = ["apartment", "house", "villa", "plot", "commercial"];
exports.LISTING_TYPES = ["sale", "rent"];
exports.SORT_OPTIONS = ["newest", "price_asc", "price_desc"];
const propertyFields = zod_1.z.object({
    title: zod_1.z.string().trim().min(10, "Title must be at least 10 characters").max(150),
    description: zod_1.z.string().trim().min(30, "Description must be at least 30 characters").max(5000),
    propertyType: zod_1.z.enum(exports.PROPERTY_TYPES),
    listingType: zod_1.z.enum(exports.LISTING_TYPES),
    price: zod_1.z.number().int("Price must be a whole number").positive("Price must be greater than 0"),
    bedrooms: zod_1.z.number().int().min(0).max(20),
    bathrooms: zod_1.z.number().int().min(0).max(20),
    areaSqft: zod_1.z.number().int().min(50, "Area must be at least 50 sq ft").max(1_000_000),
    addressLine: zod_1.z.string().trim().min(5, "Address must be at least 5 characters").max(255),
    locality: zod_1.z.string().trim().min(2).max(100),
    city: zod_1.z.string().trim().min(2).max(100),
    state: zod_1.z.string().trim().min(2).max(100),
    pincode: zod_1.z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits"),
    amenities: zod_1.z.array(zod_1.z.string().trim().min(1).max(40)).max(20),
});
exports.createPropertySchema = propertyFields.extend({
    bedrooms: propertyFields.shape.bedrooms.default(0),
    bathrooms: propertyFields.shape.bathrooms.default(0),
    amenities: propertyFields.shape.amenities.default([]),
});
exports.updatePropertySchema = propertyFields
    .partial()
    .extend({ status: zod_1.z.enum(["active", "inactive"]).optional() })
    .refine((body) => Object.keys(body).length > 0, { message: "Provide at least one field to update" });
exports.propertyIdParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
});
exports.propertyImageParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
    imageId: zod_1.z.coerce.number().int().positive(),
});
exports.searchPropertiesQuerySchema = zod_1.z
    .object({
    q: zod_1.z.string().trim().min(2, "Search text must be at least 2 characters").max(100).optional(),
    listingType: zod_1.z.enum(exports.LISTING_TYPES).optional(),
    propertyType: zod_1.z.enum(exports.PROPERTY_TYPES).optional(),
    minPrice: zod_1.z.coerce.number().int().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().int().min(0).optional(),
    minArea: zod_1.z.coerce.number().int().min(0).max(1_000_000).optional(),
    maxArea: zod_1.z.coerce.number().int().min(0).max(1_000_000).optional(),
    bedrooms: zod_1.z.coerce.number().int().min(0).max(10).optional(),
    amenities: zod_1.z.string().trim().max(300).optional(),
    sort: zod_1.z.enum(exports.SORT_OPTIONS).default("newest"),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(12),
    cursor: zod_1.z.string().max(300).optional(),
})
    .refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
    message: "minPrice cannot be greater than maxPrice",
    path: ["minPrice"],
})
    .refine((query) => query.minArea === undefined || query.maxArea === undefined || query.minArea <= query.maxArea, {
    message: "minArea cannot be greater than maxArea",
    path: ["minArea"],
});
exports.sitemapQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(5000).default(1000),
});
exports.suggestionsQuerySchema = zod_1.z.object({
    q: zod_1.z.string().trim().min(2).max(80),
});
