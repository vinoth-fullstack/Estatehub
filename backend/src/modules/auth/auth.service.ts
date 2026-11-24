import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { generateOpaqueToken, sha256 } from "../../utils/tokens";
import * as authRepository from "./auth.repository";
import { LoginInput, RegisterInput, UpdateProfileInput } from "./auth.schemas";
import fs from "node:fs/promises";
import path from "node:path";
import { uploadDirectory } from "../../middleware/uploadImages";

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

const DUMMY_PASSWORD_HASH = bcrypt.hashSync("not-a-real-password", env.BCRYPT_ROUNDS);

const toPublicUser = (user: authRepository.UserRow): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatarFileName ? `${env.PUBLIC_API_URL}/uploads/${user.avatarFileName}` : null,
  createdAt: user.createdAt.toISOString(),
});

async function issueTokens(user: authRepository.UserRow): Promise<AuthResult> {
  const accessToken = jwt.sign({ email: user.email }, env.JWT_ACCESS_SECRET, {
    subject: String(user.id),
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    algorithm: "HS256",
  });

  const refreshToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await authRepository.insertRefreshToken(user.id, sha256(refreshToken), expiresAt);

  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await authRepository.findUserByEmail(input.email);
  if (existing) throw AppError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
  const user = await authRepository.insertUser({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash,
  });
  return issueTokens(user);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await authRepository.findUserByEmail(input.email);
  const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !passwordMatches) throw AppError.unauthorized("Invalid email or password");
  return issueTokens(user);
}

export async function refresh(presentedToken: string | undefined): Promise<AuthResult> {
  if (!presentedToken) throw AppError.unauthorized("No refresh token");

  const stored = await authRepository.findRefreshToken(sha256(presentedToken));
  if (!stored) throw AppError.unauthorized("Invalid refresh token");

  if (stored.revokedAt) {
    await authRepository.revokeAllRefreshTokensForUser(stored.userId);
    throw AppError.unauthorized("Refresh token was already used. Please sign in again.");
  }
  if (stored.expiresAt < new Date()) throw AppError.unauthorized("Refresh token expired. Please sign in again.");

  const revokedNow = await authRepository.revokeRefreshToken(stored.id);
  if (!revokedNow) throw AppError.unauthorized("Refresh token was already used. Please sign in again.");

  const user = await authRepository.findUserById(stored.userId);
  if (!user) throw AppError.unauthorized("Account no longer exists");
  return issueTokens(user);
}

export async function logout(presentedToken: string | undefined): Promise<void> {
  if (presentedToken) await authRepository.revokeRefreshTokenByHash(sha256(presentedToken));
}

export async function getCurrentUser(userId: number): Promise<PublicUser> {
  const user = await authRepository.findUserById(userId);
  if (!user) throw AppError.notFound("User not found");
  return toPublicUser(user);
}

export async function updateCurrentUser(userId: number, changes: UpdateProfileInput): Promise<PublicUser> {
  const currentPassword = changes.currentPassword;
  const current = await authRepository.findUserById(userId);
  if (!current) throw AppError.notFound("User not found");
  const emailChanging = changes.email !== undefined && changes.email.toLowerCase() !== current.email.toLowerCase();
  if (emailChanging) {
    if (!currentPassword) throw AppError.badRequest("Confirm your current password before changing email", [{ path: "currentPassword", message: "Current password is required to change email" }]);
    const passwordHash = await authRepository.findPasswordHash(userId);
    if (!passwordHash || !(await bcrypt.compare(currentPassword, passwordHash))) throw AppError.badRequest("Current password is incorrect", [{ path: "currentPassword", message: "Current password is incorrect" }]);
  }
  const { currentPassword: _currentPassword, ...profileChanges } = changes;
  let user: authRepository.UserRow | undefined;
  try { user = await authRepository.updateUserProfile(userId, profileChanges); }
  catch (error) { if ((error as { code?: string; }).code === "23505") throw new AppError(409, "An account with this email already exists", "CONFLICT", [{ path: "email", message: "This email is already in use" }]); throw error; }
  if (!user) throw AppError.notFound("User not found");
  return toPublicUser(user);
}

export async function changePassword(userId: number, currentPassword: string, password: string) {
  const existing = await authRepository.findPasswordHash(userId);
  if (!existing || !(await bcrypt.compare(currentPassword, existing))) throw AppError.badRequest("Current password is incorrect", [{ path: "currentPassword", message: "Current password is incorrect" }]);
  if (await bcrypt.compare(password, existing)) throw AppError.badRequest("Choose a password you have not used before", [{ path: "password", message: "New password must be different" }]);
  await authRepository.changePassword(userId, await bcrypt.hash(password, env.BCRYPT_ROUNDS));
}

async function deliverResetEmail(email: string, link: string) {
  if (!env.RESEND_API_KEY) { console.error("Password reset email was not sent: RESEND_API_KEY is not configured"); return; }
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: env.MAIL_FROM, to: [email], subject: "Reset your EstateHub password", html: `<p>We received a request to reset your EstateHub password.</p><p><a href="${link}">Reset password</a></p><p>This link expires in ${env.RESET_TOKEN_TTL_MINUTES} minutes. If you did not request this, ignore this email.</p>` }) });
  if (!response.ok) throw new Error("Password reset email provider rejected the request");
}

export async function requestPasswordReset(email: string) {
  const user = await authRepository.findUserByEmail(email);
  if (!user) return;
  const token = generateOpaqueToken();
  await authRepository.insertPasswordReset(user.id, sha256(token), new Date(Date.now() + env.RESET_TOKEN_TTL_MINUTES * 60_000));

  void deliverResetEmail(user.email, `${env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`)
    .catch(() => console.error("Password reset email delivery failed"));
}

export async function resetPassword(token: string, password: string) {
  const reset = await authRepository.findValidPasswordReset(sha256(token));
  if (!reset) throw AppError.badRequest("This password reset link is invalid or expired");
  const changed = await authRepository.consumePasswordReset(reset.id, reset.userId, await bcrypt.hash(password, env.BCRYPT_ROUNDS));
  if (!changed) throw AppError.badRequest("This password reset link is invalid or expired");
}

export async function updateAvatar(userId: number, fileName: string | null) {
  const before = await authRepository.findUserById(userId);
  if (!before) throw AppError.notFound("User not found");
  const user = await authRepository.updateUserProfile(userId, { avatarFileName: fileName });
  if (before.avatarFileName && before.avatarFileName !== fileName) await fs.unlink(path.join(uploadDirectory, path.basename(before.avatarFileName))).catch(() => undefined);
  return toPublicUser(user!);
}
