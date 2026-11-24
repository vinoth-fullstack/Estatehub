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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInquiry = createInquiry;
exports.getReceivedInquiries = getReceivedInquiries;
exports.getSentInquiries = getSentInquiries;
exports.getConversation = getConversation;
exports.replyToInquiry = replyToInquiry;
exports.setInquiryStatus = setInquiryStatus;
const AppError_1 = require("../../utils/AppError");
const inquiryRepository = __importStar(require("./inquiry.repository"));
const env_1 = require("../../config/env");
const MAX_LINKS_IN_MESSAGE = 2;
const LINK_PATTERN = /(https?:\/\/|www\.)/gi;
async function createInquiry(propertyId, senderId, input) {
    if (input.website && input.website.trim() !== "") {
        console.warn(`Honeypot triggered by user ${senderId} on property ${propertyId}`);
        return { id: null, createdAt: new Date() };
    }
    const linkCount = input.message.match(LINK_PATTERN)?.length ?? 0;
    if (linkCount > MAX_LINKS_IN_MESSAGE) {
        throw new AppError_1.AppError(400, "Your message looks like spam. Please remove the links and try again.", "SPAM_DETECTED");
    }
    const property = await inquiryRepository.findPropertyForInquiry(propertyId);
    if (!property || property.status !== "active")
        throw AppError_1.AppError.notFound("Property not found");
    if (property.ownerId === senderId)
        throw AppError_1.AppError.badRequest("You cannot send an inquiry for your own listing");
    const inquiry = await inquiryRepository.insertInquiry(propertyId, senderId, input);
    if (!inquiry)
        throw AppError_1.AppError.conflict("You have already sent an inquiry for this property");
    return inquiry;
}
const buildPage = (result, query) => ({
    data: result.rows,
    meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
    },
});
async function getReceivedInquiries(ownerId, query) {
    const result = await inquiryRepository.listReceivedInquiries(ownerId, query.limit, (query.page - 1) * query.limit);
    result.rows = result.rows.map((row) => ({ ...row, coverImageUrl: row.coverFileName ? `${env_1.env.PUBLIC_API_URL}/uploads/${row.coverFileName}` : null, requesterAvatarUrl: row.requesterAvatarFileName ? `${env_1.env.PUBLIC_API_URL}/uploads/${row.requesterAvatarFileName}` : null, ownerAvatarUrl: row.ownerAvatarFileName ? `${env_1.env.PUBLIC_API_URL}/uploads/${row.ownerAvatarFileName}` : null }));
    return buildPage(result, query);
}
async function getSentInquiries(senderId, query) {
    const result = await inquiryRepository.listSentInquiries(senderId, query.limit, (query.page - 1) * query.limit);
    result.rows = result.rows.map((row) => ({ ...row, coverImageUrl: row.coverFileName ? `${env_1.env.PUBLIC_API_URL}/uploads/${row.coverFileName}` : null, ownerAvatarUrl: row.ownerAvatarFileName ? `${env_1.env.PUBLIC_API_URL}/uploads/${row.ownerAvatarFileName}` : null }));
    return buildPage(result, query);
}
async function getConversation(inquiryId, userId) {
    const participants = await inquiryRepository.getInquiryParticipants(inquiryId);
    if (!participants)
        throw AppError_1.AppError.notFound("Inquiry not found");
    if (participants.senderId !== userId && participants.ownerId !== userId)
        throw AppError_1.AppError.forbidden("You cannot access this conversation");
    const messages = await inquiryRepository.listMessages(inquiryId);
    return messages.map((message) => ({ ...message, senderAvatarUrl: message.senderAvatarFileName ? `${env_1.env.PUBLIC_API_URL}/uploads/${message.senderAvatarFileName}` : null }));
}
async function replyToInquiry(inquiryId, userId, message) {
    const participants = await inquiryRepository.getInquiryParticipants(inquiryId);
    if (!participants)
        throw AppError_1.AppError.notFound("Inquiry not found");
    if (participants.senderId !== userId && participants.ownerId !== userId)
        throw AppError_1.AppError.forbidden("You cannot reply to this inquiry");
    return inquiryRepository.insertMessage(inquiryId, userId, message);
}
async function setInquiryStatus(inquiryId, userId, status) {
    const participants = await inquiryRepository.getInquiryParticipants(inquiryId);
    if (!participants)
        throw AppError_1.AppError.notFound("Inquiry not found");
    if (participants.ownerId !== userId)
        throw AppError_1.AppError.forbidden("Only the property owner can update this request");
    return inquiryRepository.updateInquiryStatus(inquiryId, status);
}
