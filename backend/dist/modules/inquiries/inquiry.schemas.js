"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inquiryStatusSchema = exports.inquiryMessageSchema = exports.inquiryIdSchema = exports.listInquiriesQuerySchema = exports.inquiryPropertyParamSchema = exports.createInquirySchema = void 0;
const zod_1 = require("zod");
const auth_schemas_1 = require("../auth/auth.schemas");
exports.createInquirySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: zod_1.z.string().trim().toLowerCase().max(255).pipe(zod_1.z.email("Enter a valid email address")),
    phone: auth_schemas_1.phoneSchema,
    message: zod_1.z.string().trim().min(20, "Message must be at least 20 characters").max(1000),
    website: zod_1.z.string().max(200).optional(),
});
exports.inquiryPropertyParamSchema = zod_1.z.object({
    propertyId: zod_1.z.coerce.number().int().positive(),
});
exports.listInquiriesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
});
exports.inquiryIdSchema = zod_1.z.object({ inquiryId: zod_1.z.coerce.number().int().positive() });
exports.inquiryMessageSchema = zod_1.z.object({ message: zod_1.z.string().trim().min(1).max(2000) });
exports.inquiryStatusSchema = zod_1.z.object({ status: zod_1.z.enum(["accepted", "rejected"]) });
