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
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.getCurrentUser = getCurrentUser;
exports.updateCurrentUser = updateCurrentUser;
exports.changePassword = changePassword;
exports.requestPasswordReset = requestPasswordReset;
exports.resetPassword = resetPassword;
exports.updateAvatar = updateAvatar;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const AppError_1 = require("../../utils/AppError");
const tokens_1 = require("../../utils/tokens");
const authRepository = __importStar(require("./auth.repository"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const uploadImages_1 = require("../../middleware/uploadImages");
const DUMMY_PASSWORD_HASH = bcryptjs_1.default.hashSync("not-a-real-password", env_1.env.BCRYPT_ROUNDS);
const toPublicUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarFileName ? `${env_1.env.PUBLIC_API_URL}/uploads/${user.avatarFileName}` : null,
    createdAt: user.createdAt.toISOString(),
});
async function issueTokens(user) {
    const accessToken = jsonwebtoken_1.default.sign({ email: user.email }, env_1.env.JWT_ACCESS_SECRET, {
        subject: String(user.id),
        expiresIn: env_1.env.ACCESS_TOKEN_TTL_SECONDS,
        algorithm: "HS256",
    });
    const refreshToken = (0, tokens_1.generateOpaqueToken)();
    const expiresAt = new Date(Date.now() + env_1.env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await authRepository.insertRefreshToken(user.id, (0, tokens_1.sha256)(refreshToken), expiresAt);
    return { user: toPublicUser(user), accessToken, refreshToken };
}
async function register(input) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing)
        throw AppError_1.AppError.conflict("An account with this email already exists");
    const passwordHash = await bcryptjs_1.default.hash(input.password, env_1.env.BCRYPT_ROUNDS);
    const user = await authRepository.insertUser({
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
    });
    return issueTokens(user);
}
async function login(input) {
    const user = await authRepository.findUserByEmail(input.email);
    const passwordMatches = await bcryptjs_1.default.compare(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !passwordMatches)
        throw AppError_1.AppError.unauthorized("Invalid email or password");
    return issueTokens(user);
}
async function refresh(presentedToken) {
    if (!presentedToken)
        throw AppError_1.AppError.unauthorized("No refresh token");
    const stored = await authRepository.findRefreshToken((0, tokens_1.sha256)(presentedToken));
    if (!stored)
        throw AppError_1.AppError.unauthorized("Invalid refresh token");
    if (stored.revokedAt) {
        await authRepository.revokeAllRefreshTokensForUser(stored.userId);
        throw AppError_1.AppError.unauthorized("Refresh token was already used. Please sign in again.");
    }
    if (stored.expiresAt < new Date())
        throw AppError_1.AppError.unauthorized("Refresh token expired. Please sign in again.");
    const revokedNow = await authRepository.revokeRefreshToken(stored.id);
    if (!revokedNow)
        throw AppError_1.AppError.unauthorized("Refresh token was already used. Please sign in again.");
    const user = await authRepository.findUserById(stored.userId);
    if (!user)
        throw AppError_1.AppError.unauthorized("Account no longer exists");
    return issueTokens(user);
}
async function logout(presentedToken) {
    if (presentedToken)
        await authRepository.revokeRefreshTokenByHash((0, tokens_1.sha256)(presentedToken));
}
async function getCurrentUser(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user)
        throw AppError_1.AppError.notFound("User not found");
    return toPublicUser(user);
}
async function updateCurrentUser(userId, changes) {
    const currentPassword = changes.currentPassword;
    const current = await authRepository.findUserById(userId);
    if (!current)
        throw AppError_1.AppError.notFound("User not found");
    const emailChanging = changes.email !== undefined && changes.email.toLowerCase() !== current.email.toLowerCase();
    if (emailChanging) {
        if (!currentPassword)
            throw AppError_1.AppError.badRequest("Confirm your current password before changing email", [{ path: "currentPassword", message: "Current password is required to change email" }]);
        const passwordHash = await authRepository.findPasswordHash(userId);
        if (!passwordHash || !(await bcryptjs_1.default.compare(currentPassword, passwordHash)))
            throw AppError_1.AppError.badRequest("Current password is incorrect", [{ path: "currentPassword", message: "Current password is incorrect" }]);
    }
    const { currentPassword: _currentPassword, ...profileChanges } = changes;
    let user;
    try {
        user = await authRepository.updateUserProfile(userId, profileChanges);
    }
    catch (error) {
        if (error.code === "23505")
            throw new AppError_1.AppError(409, "An account with this email already exists", "CONFLICT", [{ path: "email", message: "This email is already in use" }]);
        throw error;
    }
    if (!user)
        throw AppError_1.AppError.notFound("User not found");
    return toPublicUser(user);
}
async function changePassword(userId, currentPassword, password) {
    const existing = await authRepository.findPasswordHash(userId);
    if (!existing || !(await bcryptjs_1.default.compare(currentPassword, existing)))
        throw AppError_1.AppError.badRequest("Current password is incorrect", [{ path: "currentPassword", message: "Current password is incorrect" }]);
    if (await bcryptjs_1.default.compare(password, existing))
        throw AppError_1.AppError.badRequest("Choose a password you have not used before", [{ path: "password", message: "New password must be different" }]);
    await authRepository.changePassword(userId, await bcryptjs_1.default.hash(password, env_1.env.BCRYPT_ROUNDS));
}
async function deliverResetEmail(email, link) {
    if (!env_1.env.RESEND_API_KEY) {
        console.error("Password reset email was not sent: RESEND_API_KEY is not configured");
        return;
    }
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${env_1.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: env_1.env.MAIL_FROM, to: [email], subject: "Reset your EstateHub password", html: `<p>We received a request to reset your EstateHub password.</p><p><a href="${link}">Reset password</a></p><p>This link expires in ${env_1.env.RESET_TOKEN_TTL_MINUTES} minutes. If you did not request this, ignore this email.</p>` }) });
    if (!response.ok)
        throw new Error("Password reset email provider rejected the request");
}
async function requestPasswordReset(email) {
    const user = await authRepository.findUserByEmail(email);
    if (!user)
        return;
    const token = (0, tokens_1.generateOpaqueToken)();
    await authRepository.insertPasswordReset(user.id, (0, tokens_1.sha256)(token), new Date(Date.now() + env_1.env.RESET_TOKEN_TTL_MINUTES * 60_000));
    void deliverResetEmail(user.email, `${env_1.env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`)
        .catch(() => console.error("Password reset email delivery failed"));
}
async function resetPassword(token, password) {
    const reset = await authRepository.findValidPasswordReset((0, tokens_1.sha256)(token));
    if (!reset)
        throw AppError_1.AppError.badRequest("This password reset link is invalid or expired");
    const changed = await authRepository.consumePasswordReset(reset.id, reset.userId, await bcryptjs_1.default.hash(password, env_1.env.BCRYPT_ROUNDS));
    if (!changed)
        throw AppError_1.AppError.badRequest("This password reset link is invalid or expired");
}
async function updateAvatar(userId, fileName) {
    const before = await authRepository.findUserById(userId);
    if (!before)
        throw AppError_1.AppError.notFound("User not found");
    const user = await authRepository.updateUserProfile(userId, { avatarFileName: fileName });
    if (before.avatarFileName && before.avatarFileName !== fileName)
        await promises_1.default.unlink(node_path_1.default.join(uploadImages_1.uploadDirectory, node_path_1.default.basename(before.avatarFileName))).catch(() => undefined);
    return toPublicUser(user);
}
