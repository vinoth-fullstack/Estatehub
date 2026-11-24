import { z } from "zod";
import { phoneSchema } from "../auth/auth.schemas";

export const createInquirySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().max(255).pipe(z.email("Enter a valid email address")),
  phone: phoneSchema,
  message: z.string().trim().min(20, "Message must be at least 20 characters").max(1000),

  website: z.string().max(200).optional(),
});

export const inquiryPropertyParamSchema = z.object({
  propertyId: z.coerce.number().int().positive(),
});

export const listInquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export const inquiryIdSchema = z.object({ inquiryId: z.coerce.number().int().positive() });
export const inquiryMessageSchema = z.object({ message: z.string().trim().min(1).max(2000) });
export const inquiryStatusSchema = z.object({ status: z.enum(["accepted", "rejected"]) });

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type ListInquiriesQuery = z.infer<typeof listInquiriesQuerySchema>;
