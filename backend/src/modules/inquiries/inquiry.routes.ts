import { Router } from "express";
import { requireAuth } from "../../middleware/authenticate";
import { inquiryLimiter } from "../../middleware/rateLimiters";
import { validateRequest } from "../../middleware/validateRequest";
import * as inquiryController from "./inquiry.controller";
import { createInquirySchema, inquiryIdSchema, inquiryMessageSchema, inquiryPropertyParamSchema, inquiryStatusSchema, listInquiriesQuerySchema } from "./inquiry.schemas";

export const propertyInquiryRouter = Router({ mergeParams: true });

propertyInquiryRouter.post(
  "/",
  requireAuth,
  inquiryLimiter,
  validateRequest({ params: inquiryPropertyParamSchema, body: createInquirySchema }),
  inquiryController.createInquiry,
);

export const inquiryRouter = Router();

inquiryRouter.get("/received", requireAuth, validateRequest({ query: listInquiriesQuerySchema }), inquiryController.listReceivedInquiries);
inquiryRouter.get("/sent", requireAuth, validateRequest({ query: listInquiriesQuerySchema }), inquiryController.listSentInquiries);
inquiryRouter.get("/:inquiryId/messages", requireAuth, validateRequest({ params: inquiryIdSchema }), inquiryController.getConversation);
inquiryRouter.post("/:inquiryId/messages", requireAuth, validateRequest({ params: inquiryIdSchema, body: inquiryMessageSchema }), inquiryController.replyToInquiry);
inquiryRouter.patch("/:inquiryId/status", requireAuth, validateRequest({ params: inquiryIdSchema, body: inquiryStatusSchema }), inquiryController.updateInquiryStatus);
