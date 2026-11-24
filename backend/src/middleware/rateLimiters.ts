import rateLimit from "express-rate-limit";
import { env } from "../config/env";

const tooManyRequests = (message: string) => ({
  error: { code: "RATE_LIMITED", message },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: tooManyRequests("Too many requests. Please slow down."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: tooManyRequests("Too many authentication attempts. Try again in a few minutes."),
});

export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: tooManyRequests("Too many password reset attempts. Please try again later."),
});

export const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.INQUIRY_LIMIT_PER_HOUR,
  keyGenerator: (req) => `user:${req.user?.id ?? "anonymous"}`,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: tooManyRequests("You have sent too many inquiries. Please try again later."),
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  keyGenerator: (req) => `user:${req.user?.id ?? "anonymous"}`,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: tooManyRequests("Too many uploads. Please try again later."),
});
