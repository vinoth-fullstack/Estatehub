"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAvatar = exports.avatarUploadMiddleware = exports.uploadAvatar = exports.resetPassword = exports.requestPasswordReset = exports.changePassword = exports.updateCurrentUser = exports.getCurrentUser = exports.logout = exports.refresh = exports.login = exports.register = exports.REFRESH_COOKIE_NAME = void 0;
const env_1 = require("../../config/env");
const asyncHandler_1 = require("../../utils/asyncHandler");
const authService = __importStar(require("./auth.service"));
const imageSignature_1 = require("../../utils/imageSignature");
const asyncHandler_2 = require("../../utils/asyncHandler");
const AppError_1 = require("../../utils/AppError");
const uploadImages_1 = require("../../middleware/uploadImages");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
exports.REFRESH_COOKIE_NAME = "refresh_token";
const refreshCookieOptions = {
    httpOnly: true,
    secure: env_1.isProduction,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: env_1.env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};
function sendAuthResponse(res, status, result) {
    res.cookie(exports.REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
    res.status(status).json({ user: result.user, accessToken: result.accessToken });
}
exports.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    sendAuthResponse(res, 201, await authService.register(req.body));
});
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    sendAuthResponse(res, 200, await authService.login(req.body));
});
exports.refresh = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        sendAuthResponse(res, 200, await authService.refresh(req.cookies?.[exports.REFRESH_COOKIE_NAME]));
    }
    catch (error) {
        res.clearCookie(exports.REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: undefined });
        throw error;
    }
});
exports.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await authService.logout(req.cookies?.[exports.REFRESH_COOKIE_NAME]);
    res.clearCookie(exports.REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: undefined });
    res.status(204).send();
});
exports.getCurrentUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json({ user: await authService.getCurrentUser(req.user.id) });
});
exports.updateCurrentUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json({ user: await authService.updateCurrentUser(req.user.id, req.body) });
});
exports.changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await authService.changePassword(req.user.id, req.body.currentPassword, req.body.password);
    res.json({ message: "Password updated. Please sign in again on your other devices." });
});
exports.requestPasswordReset = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const startedAt = Date.now();
    try {
        await authService.requestPasswordReset(req.body.email);
    }
    catch {
        console.error("Could not deliver a password reset email");
    }
    const remaining = 250 - (Date.now() - startedAt);
    if (remaining > 0)
        await new Promise((resolve) => setTimeout(resolve, remaining));
    res.json({ message: "If an account exists for that email, password reset instructions will be sent shortly." });
});
exports.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ message: "Password reset successfully. Sign in with your new password." });
});
exports.uploadAvatar = (0, asyncHandler_2.asyncHandler)(async (req, res) => {
    const files = req.files;
    if (!files?.[0])
        throw AppError_1.AppError.badRequest("Choose a JPG, PNG or WebP image");
    if (files.length !== 1) {
        await Promise.all(files.map((file) => promises_1.default.unlink(file.path).catch(() => undefined)));
        throw AppError_1.AppError.badRequest("Upload one profile image at a time");
    }
    const detected = await (0, imageSignature_1.detectImageType)(files[0].path);
    if (!detected || detected.mime !== files[0].mimetype) {
        await promises_1.default.unlink(node_path_1.default.join(uploadImages_1.uploadDirectory, node_path_1.default.basename(files[0].filename))).catch(() => undefined);
        throw AppError_1.AppError.badRequest("The selected file is not a valid image");
    }
    res.json({ user: await authService.updateAvatar(req.user.id, files[0].filename) });
});
exports.avatarUploadMiddleware = uploadImages_1.uploadPropertyImages;
exports.removeAvatar = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json({ user: await authService.updateAvatar(req.user.id, null) });
});
