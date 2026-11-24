import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export const uploadDirectory = path.resolve(env.UPLOAD_DIR);
fs.mkdirSync(uploadDirectory, { recursive: true });

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES_PER_REQUEST = 5;

export const uploadPropertyImages = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => {
      callback(null, `${crypto.randomUUID()}.${EXTENSION_BY_MIME[file.mimetype] ?? "bin"}`);
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: MAX_FILES_PER_REQUEST },
  fileFilter: (_req, file, callback) => {
    if (EXTENSION_BY_MIME[file.mimetype]) return callback(null, true);
    callback(AppError.badRequest("Only JPEG, PNG and WebP images are allowed"));
  },
}).array("images", MAX_FILES_PER_REQUEST);
