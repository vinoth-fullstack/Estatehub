"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const multer_1 = __importDefault(require("multer"));
const AppError_1 = require("../utils/AppError");
function notFoundHandler(req, _res, next) {
    next(AppError_1.AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json({
            error: { code: err.code, message: err.message, details: err.details },
        });
    }
    if (err instanceof multer_1.default.MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE"
            ? "Each image must be 5 MB or smaller"
            : err.code === "LIMIT_FILE_COUNT" ||
                err.code === "LIMIT_UNEXPECTED_FILE"
                ? "You can upload at most 5 images at a time (field name: images)"
                : err.message;
        return res.status(400).json({ error: { code: "UPLOAD_ERROR", message } });
    }
    if (err instanceof SyntaxError && "body" in err) {
        return res
            .status(400)
            .json({
            error: {
                code: "INVALID_JSON",
                message: "Request body is not valid JSON",
            },
        });
    }
    const pgCode = err?.code;
    if (pgCode === "23505") {
        return res
            .status(409)
            .json({
            error: { code: "CONFLICT", message: "This record already exists" },
        });
    }
    if (pgCode === "23503") {
        return res
            .status(400)
            .json({
            error: {
                code: "BAD_REFERENCE",
                message: "Referenced record does not exist",
            },
        });
    }
    console.error("Unhandled error:", err);
    res.status(500).json({
        error: {
            code: "INTERNAL_ERROR",
            message: "Something went wrong on our side",
            details: undefined,
        },
    });
}
