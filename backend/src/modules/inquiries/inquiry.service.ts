import { AppError } from "../../utils/AppError";
import * as inquiryRepository from "./inquiry.repository";
import { CreateInquiryInput, ListInquiriesQuery } from "./inquiry.schemas";
import { env } from "../../config/env";

const MAX_LINKS_IN_MESSAGE = 2;
const LINK_PATTERN = /(https?:\/\/|www\.)/gi;

export async function createInquiry(propertyId: number, senderId: number, input: CreateInquiryInput) {
  if (input.website && input.website.trim() !== "") {

    console.warn(`Honeypot triggered by user ${senderId} on property ${propertyId}`);
    return { id: null, createdAt: new Date() };
  }

  const linkCount = input.message.match(LINK_PATTERN)?.length ?? 0;
  if (linkCount > MAX_LINKS_IN_MESSAGE) {
    throw new AppError(400, "Your message looks like spam. Please remove the links and try again.", "SPAM_DETECTED");
  }

  const property = await inquiryRepository.findPropertyForInquiry(propertyId);
  if (!property || property.status !== "active") throw AppError.notFound("Property not found");
  if (property.ownerId === senderId) throw AppError.badRequest("You cannot send an inquiry for your own listing");

  const inquiry = await inquiryRepository.insertInquiry(propertyId, senderId, input);
  if (!inquiry) throw AppError.conflict("You have already sent an inquiry for this property");
  return inquiry;
}

const buildPage = <T>(result: { rows: T[]; total: number; }, query: ListInquiriesQuery) => ({
  data: result.rows,
  meta: {
    page: query.page,
    limit: query.limit,
    total: result.total,
    totalPages: Math.ceil(result.total / query.limit),
  },
});

export async function getReceivedInquiries(ownerId: number, query: ListInquiriesQuery) {
  const result = await inquiryRepository.listReceivedInquiries(ownerId, query.limit, (query.page - 1) * query.limit);
  result.rows = result.rows.map((row: Record<string, unknown>) => ({ ...row, coverImageUrl: row.coverFileName ? `${env.PUBLIC_API_URL}/uploads/${row.coverFileName}` : null, requesterAvatarUrl: row.requesterAvatarFileName ? `${env.PUBLIC_API_URL}/uploads/${row.requesterAvatarFileName}` : null, ownerAvatarUrl: row.ownerAvatarFileName ? `${env.PUBLIC_API_URL}/uploads/${row.ownerAvatarFileName}` : null }));
  return buildPage(result, query);
}

export async function getSentInquiries(senderId: number, query: ListInquiriesQuery) {
  const result = await inquiryRepository.listSentInquiries(senderId, query.limit, (query.page - 1) * query.limit);
  result.rows = result.rows.map((row: Record<string, unknown>) => ({ ...row, coverImageUrl: row.coverFileName ? `${env.PUBLIC_API_URL}/uploads/${row.coverFileName}` : null, ownerAvatarUrl: row.ownerAvatarFileName ? `${env.PUBLIC_API_URL}/uploads/${row.ownerAvatarFileName}` : null }));
  return buildPage(result, query);
}

export async function getConversation(inquiryId: number, userId: number) {
  const participants = await inquiryRepository.getInquiryParticipants(inquiryId);
  if (!participants) throw AppError.notFound("Inquiry not found");
  if (participants.senderId !== userId && participants.ownerId !== userId) throw AppError.forbidden("You cannot access this conversation");
  const messages = await inquiryRepository.listMessages(inquiryId);
  return messages.map((message: Record<string, unknown>) => ({ ...message, senderAvatarUrl: message.senderAvatarFileName ? `${env.PUBLIC_API_URL}/uploads/${message.senderAvatarFileName}` : null }));
}

export async function replyToInquiry(inquiryId: number, userId: number, message: string) {
  const participants = await inquiryRepository.getInquiryParticipants(inquiryId);
  if (!participants) throw AppError.notFound("Inquiry not found");
  if (participants.senderId !== userId && participants.ownerId !== userId) throw AppError.forbidden("You cannot reply to this inquiry");
  return inquiryRepository.insertMessage(inquiryId, userId, message);
}

export async function setInquiryStatus(inquiryId: number, userId: number, status: "accepted" | "rejected") {
  const participants = await inquiryRepository.getInquiryParticipants(inquiryId);
  if (!participants) throw AppError.notFound("Inquiry not found");
  if (participants.ownerId !== userId) throw AppError.forbidden("Only the property owner can update this request");
  return inquiryRepository.updateInquiryStatus(inquiryId, status);
}
