import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { openApiDocument } from "./docs/openapi";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiters";
import { uploadDirectory } from "./middleware/uploadImages";
import { authRouter } from "./modules/auth/auth.routes";
import { healthRouter } from "./modules/health/health.routes";
import { inquiryRouter, propertyInquiryRouter } from "./modules/inquiries/inquiry.routes";
import { propertyRouter } from "./modules/properties/property.routes";

export function createApp() {
  const app = express();

  app.set("trust proxy", env.TRUST_PROXY);
  app.disable("x-powered-by");

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(compression());
  if (env.NODE_ENV !== "test") app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.use("/uploads", express.static(uploadDirectory, { maxAge: "7d", immutable: true }));

  app.use(
    "/api-docs",
    (_req: Request, res: Response, next: NextFunction) => {
      res.removeHeader("Content-Security-Policy");
      next();
    },
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, { customSiteTitle: "EstateHub API Docs" }),
  );
  app.get("/api-docs.json", (_req, res) => res.json(openApiDocument));

  app.use("/api", apiLimiter);
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/properties/:propertyId/inquiries", propertyInquiryRouter);
  app.use("/api/properties", propertyRouter);
  app.use("/api/inquiries", inquiryRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
