"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = exports.phoneSchema = void 0;
const zod_1 = require("zod");
const email = zod_1.z.string().trim().toLowerCase().max(255).pipe(zod_1.z.email("Enter a valid email address"));
const password = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/\d/, "Password must contain at least one number");
exports.phoneSchema = zod_1.z
    .string()
    .trim()
    .regex(/^\+?\d{10,14}$/, "Enter a valid phone number (10-14 digits, optional leading +)");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email,
    password,
    phone: exports.phoneSchema.optional(),
});
exports.loginSchema = zod_1.z.object({
    email,
    password: zod_1.z.string().min(1, "Password is required").max(72),
});
const profilePhoneSchema = zod_1.z.union([exports.phoneSchema, zod_1.z.literal(""), zod_1.z.null()]).transform((value) => value || null);
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
    email,
    phone: profilePhoneSchema.optional(),
    currentPassword: zod_1.z.string().min(1).max(72).optional(),
}).refine((input) => Object.keys(input).some((key) => key !== "currentPassword"), { message: "Provide profile details to update" });
exports.forgotPasswordSchema = zod_1.z.object({ email });
exports.resetPasswordSchema = zod_1.z.object({ token: zod_1.z.string().min(20).max(200), password, confirmPassword: zod_1.z.string().min(8).max(72) }).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
exports.changePasswordSchema = zod_1.z.object({ currentPassword: zod_1.z.string().min(1).max(72), password, confirmPassword: zod_1.z.string().min(8).max(72) }).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
