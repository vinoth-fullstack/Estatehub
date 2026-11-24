import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../utils/AppError";

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
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

  const pgCode = (err as { code?: string; })?.code;
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
