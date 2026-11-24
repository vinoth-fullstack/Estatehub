import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/authenticate";
import { uploadLimiter } from "../../middleware/rateLimiters";
import { uploadPropertyImages } from "../../middleware/uploadImages";
import { validateRequest } from "../../middleware/validateRequest";
import * as propertyController from "./property.controller";
import {
  createPropertySchema,
  propertyIdParamSchema,
  propertyImageParamSchema,
  searchPropertiesQuerySchema,
  suggestionsQuerySchema,
  sitemapQuerySchema,
  updatePropertySchema,
} from "./property.schemas";

export const propertyRouter = Router();

propertyRouter.get("/", validateRequest({ query: searchPropertiesQuerySchema }), propertyController.listProperties);
propertyRouter.get("/suggestions", validateRequest({ query: suggestionsQuerySchema }), propertyController.suggestProperties);
propertyRouter.get("/mine", requireAuth, validateRequest({ query: searchPropertiesQuerySchema }), propertyController.listMyProperties);
propertyRouter.get("/sitemap", validateRequest({ query: sitemapQuerySchema }), propertyController.getSitemap);

propertyRouter.get("/:id", optionalAuth, validateRequest({ params: propertyIdParamSchema }), propertyController.getProperty);
propertyRouter.get("/:id/similar", validateRequest({ params: propertyIdParamSchema }), propertyController.getSimilarProperties);

propertyRouter.post("/", requireAuth, validateRequest({ body: createPropertySchema }), propertyController.createProperty);
propertyRouter.put(
  "/:id",
  requireAuth,
  validateRequest({ params: propertyIdParamSchema, body: updatePropertySchema }),
  propertyController.updateProperty,
);
propertyRouter.delete("/:id", requireAuth, validateRequest({ params: propertyIdParamSchema }), propertyController.deleteProperty);

propertyRouter.post(
  "/:id/images",
  requireAuth,
  uploadLimiter,
  validateRequest({ params: propertyIdParamSchema }),
  uploadPropertyImages,
  propertyController.uploadImages,
);
propertyRouter.delete(
  "/:id/images/:imageId",
  requireAuth,
  validateRequest({ params: propertyImageParamSchema }),
  propertyController.deleteImage,
);
