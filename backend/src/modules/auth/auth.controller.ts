import { CookieOptions, Request, Response } from "express";
import { env, isProduction } from "../../config/env";
import { asyncHandler } from "../../utils/asyncHandler";
import * as authService from "./auth.service";
import { detectImageType } from "../../utils/imageSignature";
import { asyncHandler as wrap } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { uploadDirectory, uploadPropertyImages } from "../../middleware/uploadImages";
import fs from "node:fs/promises";
import path from "node:path";

export const REFRESH_COOKIE_NAME = "refresh_token";

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/api/auth",
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

function sendAuthResponse(res: Response, status: number, result: authService.AuthResult) {
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
  res.status(status).json({ user: result.user, accessToken: result.accessToken });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  sendAuthResponse(res, 201, await authService.register(req.body));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  sendAuthResponse(res, 200, await authService.login(req.body));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  try {
    sendAuthResponse(res, 200, await authService.refresh(req.cookies?.[REFRESH_COOKIE_NAME]));
  } catch (error) {

    res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: undefined });
    throw error;
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE_NAME]);
  res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: undefined });
  res.status(204).send();
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: await authService.getCurrentUser(req.user!.id) });
});

export const updateCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: await authService.updateCurrentUser(req.user!.id, req.body) });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.password);
  res.json({ message: "Password updated. Please sign in again on your other devices." });
});

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  try { await authService.requestPasswordReset(req.body.email); }
  catch { console.error("Could not deliver a password reset email"); }
  const remaining = 250 - (Date.now() - startedAt);
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
  res.json({ message: "If an account exists for that email, password reset instructions will be sent shortly." });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json({ message: "Password reset successfully. Sign in with your new password." });
});

export const uploadAvatar = wrap(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.[0]) throw AppError.badRequest("Choose a JPG, PNG or WebP image");
  if (files.length !== 1) {
    await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => undefined)));
    throw AppError.badRequest("Upload one profile image at a time");
  }
  const detected = await detectImageType(files[0].path);
  if (!detected || detected.mime !== files[0].mimetype) {
    await fs.unlink(path.join(uploadDirectory, path.basename(files[0].filename))).catch(() => undefined);
    throw AppError.badRequest("The selected file is not a valid image");
  }
  res.json({ user: await authService.updateAvatar(req.user!.id, files[0].filename) });
});

export const avatarUploadMiddleware = uploadPropertyImages;

export const removeAvatar = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: await authService.updateAvatar(req.user!.id, null) });
});
