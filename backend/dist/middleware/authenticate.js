"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const AppError_1 = require("../utils/AppError");
function readUserFromHeader(req) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
        return null;
    try {
        const payload = jsonwebtoken_1.default.verify(header.slice(7), env_1.env.JWT_ACCESS_SECRET, {
            algorithms: ["HS256"],
        });
        return { id: Number(payload.sub), email: payload.email };
    }
    catch {
        return null;
    }
}
function requireAuth(req, _res, next) {
    const user = readUserFromHeader(req);
    if (!user)
        return next(AppError_1.AppError.unauthorized("Invalid or expired access token"));
    req.user = user;
    next();
}
function optionalAuth(req, _res, next) {
    const user = readUserFromHeader(req);
    if (user)
        req.user = user;
    next();
}
