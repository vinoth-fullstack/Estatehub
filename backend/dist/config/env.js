"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().int().positive().default(4000),
    PUBLIC_API_URL: zod_1.z.string().url().default("http://localhost:4000"),
    CLIENT_ORIGIN: zod_1.z.string().url().default("http://localhost:3000"),
    TRUST_PROXY: zod_1.z.coerce.number().int().min(0).default(0),
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    ACCESS_TOKEN_TTL_SECONDS: zod_1.z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_DAYS: zod_1.z.coerce.number().int().positive().default(7),
    BCRYPT_ROUNDS: zod_1.z.coerce.number().int().min(4).max(15).default(12),
    UPLOAD_DIR: zod_1.z.string().default("uploads"),
    INQUIRY_LIMIT_PER_HOUR: zod_1.z.coerce.number().int().positive().default(5),
    RESET_TOKEN_TTL_MINUTES: zod_1.z.coerce.number().int().min(10).max(60).default(20),
    CLIENT_URL: zod_1.z.string().url().default("http://localhost:3000"),
    RESEND_API_KEY: zod_1.z.string().optional(),
    MAIL_FROM: zod_1.z.string().default("EstateHub <onboarding@resend.dev>"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const problems = parsed.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
    console.error(`Invalid environment configuration:\n${problems}`);
    process.exit(1);
}
exports.env = parsed.data;
exports.isProduction = exports.env.NODE_ENV === "production";
