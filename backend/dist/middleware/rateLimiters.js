"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLimiter = exports.inquiryLimiter = exports.passwordResetLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
const tooManyRequests = (message) => ({
    error: { code: "RATE_LIMITED", message },
});
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: tooManyRequests("Too many requests. Please slow down."),
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: tooManyRequests("Too many authentication attempts. Try again in a few minutes."),
});
exports.passwordResetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: tooManyRequests("Too many password reset attempts. Please try again later."),
});
exports.inquiryLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    limit: env_1.env.INQUIRY_LIMIT_PER_HOUR,
    keyGenerator: (req) => `user:${req.user?.id ?? "anonymous"}`,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: tooManyRequests("You have sent too many inquiries. Please try again later."),
});
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    limit: 60,
    keyGenerator: (req) => `user:${req.user?.id ?? "anonymous"}`,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: tooManyRequests("Too many uploads. Please try again later."),
});
