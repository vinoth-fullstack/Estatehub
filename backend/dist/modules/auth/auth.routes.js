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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const authenticate_1 = require("../../middleware/authenticate");
const rateLimiters_1 = require("../../middleware/rateLimiters");
const validateRequest_1 = require("../../middleware/validateRequest");
const authController = __importStar(require("./auth.controller"));
const auth_schemas_1 = require("./auth.schemas");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/register", rateLimiters_1.authLimiter, (0, validateRequest_1.validateRequest)({ body: auth_schemas_1.registerSchema }), authController.register);
exports.authRouter.post("/login", rateLimiters_1.authLimiter, (0, validateRequest_1.validateRequest)({ body: auth_schemas_1.loginSchema }), authController.login);
exports.authRouter.post("/refresh", authController.refresh);
exports.authRouter.post("/logout", authController.logout);
exports.authRouter.post("/forgot-password", rateLimiters_1.passwordResetLimiter, (0, validateRequest_1.validateRequest)({ body: auth_schemas_1.forgotPasswordSchema }), authController.requestPasswordReset);
exports.authRouter.post("/reset-password", rateLimiters_1.passwordResetLimiter, (0, validateRequest_1.validateRequest)({ body: auth_schemas_1.resetPasswordSchema }), authController.resetPassword);
exports.authRouter.get("/me", authenticate_1.requireAuth, authController.getCurrentUser);
exports.authRouter.patch("/me", authenticate_1.requireAuth, (0, validateRequest_1.validateRequest)({ body: auth_schemas_1.updateProfileSchema }), authController.updateCurrentUser);
exports.authRouter.post("/change-password", authenticate_1.requireAuth, (0, validateRequest_1.validateRequest)({ body: auth_schemas_1.changePasswordSchema }), authController.changePassword);
exports.authRouter.post("/me/avatar", authenticate_1.requireAuth, rateLimiters_1.uploadLimiter, authController.avatarUploadMiddleware, authController.uploadAvatar);
exports.authRouter.delete("/me/avatar", authenticate_1.requireAuth, authController.removeAvatar);
