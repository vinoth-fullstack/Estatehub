"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, message, code = "ERROR", details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = "AppError";
    }
    static badRequest(message, details) {
        return new AppError(400, message, "BAD_REQUEST", details);
    }
    static unauthorized(message = "Authentication required") {
        return new AppError(401, message, "UNAUTHORIZED");
    }
    static forbidden(message = "You do not have permission to do this") {
        return new AppError(403, message, "FORBIDDEN");
    }
    static notFound(message = "Resource not found") {
        return new AppError(404, message, "NOT_FOUND");
    }
    static conflict(message) {
        return new AppError(409, message, "CONFLICT");
    }
}
exports.AppError = AppError;
