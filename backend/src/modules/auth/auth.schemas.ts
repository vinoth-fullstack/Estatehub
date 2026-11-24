import { z } from "zod";

const email = z.string().trim().toLowerCase().max(255).pipe(z.email("Enter a valid email address"));

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{10,14}$/, "Enter a valid phone number (10-14 digits, optional leading +)");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email,
  password,
  phone: phoneSchema.optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(72),
});

const profilePhoneSchema = z.union([phoneSchema, z.literal(""), z.null()]).transform((value) => value || null);

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
  email,
  phone: profilePhoneSchema.optional(),
  currentPassword: z.string().min(1).max(72).optional(),
}).refine((input) => Object.keys(input).some((key) => key !== "currentPassword"), { message: "Provide profile details to update" });

export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({ token: z.string().min(20).max(200), password, confirmPassword: z.string().min(8).max(72) }).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(72), password, confirmPassword: z.string().min(8).max(72) }).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
