import { Router } from "express";
import { requireAuth } from "../../middleware/authenticate";
import { authLimiter, passwordResetLimiter, uploadLimiter } from "../../middleware/rateLimiters";
import { validateRequest } from "../../middleware/validateRequest";
import * as authController from "./auth.controller";
import { changePasswordSchema, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, updateProfileSchema } from "./auth.schemas";

export const authRouter = Router();

authRouter.post("/register", authLimiter, validateRequest({ body: registerSchema }), authController.register);
authRouter.post("/login", authLimiter, validateRequest({ body: loginSchema }), authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.post("/forgot-password", passwordResetLimiter, validateRequest({ body: forgotPasswordSchema }), authController.requestPasswordReset);
authRouter.post("/reset-password", passwordResetLimiter, validateRequest({ body: resetPasswordSchema }), authController.resetPassword);
authRouter.get("/me", requireAuth, authController.getCurrentUser);
authRouter.patch("/me", requireAuth, validateRequest({ body: updateProfileSchema }), authController.updateCurrentUser);
authRouter.post("/change-password", requireAuth, validateRequest({ body: changePasswordSchema }), authController.changePassword);
authRouter.post("/me/avatar", requireAuth, uploadLimiter, authController.avatarUploadMiddleware, authController.uploadAvatar);
authRouter.delete("/me/avatar", requireAuth, authController.removeAvatar);
