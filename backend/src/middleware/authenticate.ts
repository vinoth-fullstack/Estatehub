import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

interface AccessTokenPayload {
  sub: string;
  email: string;
}

function readUserFromHeader(req: Request): Request["user"] | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    }) as unknown as AccessTokenPayload;
    return { id: Number(payload.sub), email: payload.email };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = readUserFromHeader(req);
  if (!user)
    return next(AppError.unauthorized("Invalid or expired access token"));
  req.user = user;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const user = readUserFromHeader(req);
  if (user) req.user = user;
  next();
}
