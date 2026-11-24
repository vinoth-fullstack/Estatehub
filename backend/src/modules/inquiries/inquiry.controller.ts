import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as inquiryService from "./inquiry.service";

export const createInquiry = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.params as never as { propertyId: number; };
  const inquiry = await inquiryService.createInquiry(propertyId, req.user!.id, req.body);
  res.status(201).json({ data: inquiry, message: "Your inquiry has been sent to the owner" });
});

export const listReceivedInquiries = asyncHandler(async (req: Request, res: Response) => {
  res.set("Cache-Control", "private, no-store");
  res.json(await inquiryService.getReceivedInquiries(req.user!.id, req.query as never));
});

export const listSentInquiries = asyncHandler(async (req: Request, res: Response) => {
  res.set("Cache-Control", "private, no-store");
  res.json(await inquiryService.getSentInquiries(req.user!.id, req.query as never));
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  res.set("Cache-Control", "private, no-store");
  res.json({ data: await inquiryService.getConversation(Number(req.params.inquiryId), req.user!.id) });
});
export const replyToInquiry = asyncHandler(async (req: Request, res: Response) => {
  const message = await inquiryService.replyToInquiry(Number(req.params.inquiryId), req.user!.id, req.body.message);
  res.status(201).json({ data: message });
});
export const updateInquiryStatus = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await inquiryService.setInquiryStatus(Number(req.params.inquiryId), req.user!.id, req.body.status) });
});
