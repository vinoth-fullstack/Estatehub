"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPropertyImages = exports.MAX_FILES_PER_REQUEST = exports.MAX_IMAGE_SIZE_BYTES = exports.uploadDirectory = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const multer_1 = __importDefault(require("multer"));
const env_1 = require("../config/env");
const AppError_1 = require("../utils/AppError");
exports.uploadDirectory = node_path_1.default.resolve(env_1.env.UPLOAD_DIR);
node_fs_1.default.mkdirSync(exports.uploadDirectory, { recursive: true });
const EXTENSION_BY_MIME = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};
exports.MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
exports.MAX_FILES_PER_REQUEST = 5;
exports.uploadPropertyImages = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: exports.uploadDirectory,
        filename: (_req, file, callback) => {
            callback(null, `${node_crypto_1.default.randomUUID()}.${EXTENSION_BY_MIME[file.mimetype] ?? "bin"}`);
        },
    }),
    limits: { fileSize: exports.MAX_IMAGE_SIZE_BYTES, files: exports.MAX_FILES_PER_REQUEST },
    fileFilter: (_req, file, callback) => {
        if (EXTENSION_BY_MIME[file.mimetype])
            return callback(null, true);
        callback(AppError_1.AppError.badRequest("Only JPEG, PNG and WebP images are allowed"));
    },
}).array("images", exports.MAX_FILES_PER_REQUEST);
