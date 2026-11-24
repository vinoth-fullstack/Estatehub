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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSitemapEntries = exports.suggestProperties = void 0;
exports.searchProperties = searchProperties;
exports.getPropertyDetail = getPropertyDetail;
exports.getSimilarProperties = getSimilarProperties;
exports.createProperty = createProperty;
exports.updateProperty = updateProperty;
exports.deleteProperty = deleteProperty;
exports.addPropertyImages = addPropertyImages;
exports.removePropertyImage = removePropertyImage;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const env_1 = require("../../config/env");
const uploadImages_1 = require("../../middleware/uploadImages");
const AppError_1 = require("../../utils/AppError");
const cursor_1 = require("../../utils/cursor");
const imageSignature_1 = require("../../utils/imageSignature");
const ttlCache_1 = require("../../utils/ttlCache");
const propertyRepository = __importStar(require("./property.repository"));
const MAX_IMAGES_PER_PROPERTY = 10;
const SIMILAR_PROPERTIES_LIMIT = 6;
const MAX_OFFSET_ROWS = 100_000;
const imageUrl = (fileName) => `${env_1.env.PUBLIC_API_URL}/uploads/${fileName}`;
function toCard(row) {
    const { coverFileName, ...rest } = row;
    return { ...rest, coverImageUrl: coverFileName ? imageUrl(coverFileName) : null };
}
function assertBusinessRules(subject) {
    const problems = [];
    if (subject.propertyType === "plot" && (subject.bedrooms > 0 || subject.bathrooms > 0)) {
        problems.push({ path: "bedrooms", message: "A plot cannot have bedrooms or bathrooms" });
    }
    if (subject.listingType === "sale" && subject.price < 100_000) {
        problems.push({ path: "price", message: "Sale price must be at least 1,00,000" });
    }
    if (subject.listingType === "rent" && (subject.price < 500 || subject.price > 10_000_000)) {
        problems.push({ path: "price", message: "Monthly rent must be between 500 and 1,00,00,000" });
    }
    if (problems.length > 0)
        throw new AppError_1.AppError(400, "Validation failed", "VALIDATION_ERROR", problems);
}
async function assertOwnership(propertyId, userId) {
    const ownerId = await propertyRepository.findOwnerId(propertyId);
    if (ownerId === undefined)
        throw AppError_1.AppError.notFound("Property not found");
    if (ownerId !== userId)
        throw AppError_1.AppError.forbidden("You can only modify your own listings");
}
async function searchProperties(filters, scope = {}) {
    const usingCursor = Boolean(filters.cursor);
    if (!usingCursor && filters.page * filters.limit > MAX_OFFSET_ROWS) {
        throw AppError_1.AppError.badRequest(`Page ${filters.page} is too deep. Narrow your filters or use the "cursor" parameter instead of "page".`);
    }
    const cursor = filters.cursor ? (0, cursor_1.decodeCursor)(filters.cursor) : undefined;
    const [{ rows }, total] = await Promise.all([
        propertyRepository.searchPropertyRows(filters, scope, cursor),
        usingCursor ? Promise.resolve(null) : propertyRepository.countProperties(filters, scope),
    ]);
    const hasNextPage = rows.length > filters.limit;
    const pageRows = hasNextPage ? rows.slice(0, filters.limit) : rows;
    const lastRow = pageRows[pageRows.length - 1];
    const maxNumberedPages = Math.floor(MAX_OFFSET_ROWS / filters.limit);
    const totalPages = total === null ? null : Math.min(Math.ceil(total / filters.limit), maxNumberedPages);
    return {
        data: pageRows.map(({ sortValue: _sortValue, ...row }) => toCard(row)),
        meta: {
            page: usingCursor ? null : filters.page,
            limit: filters.limit,
            total,
            totalPages,
            hasNextPage: usingCursor ? hasNextPage : hasNextPage && filters.page < (totalPages ?? 1),
            nextCursor: hasNextPage && lastRow ? (0, cursor_1.encodeCursor)({ value: lastRow.sortValue, id: lastRow.id }) : null,
        },
    };
}
const suggestProperties = (q) => propertyRepository.suggestProperties(q);
exports.suggestProperties = suggestProperties;
async function getPropertyDetail(propertyId, viewerId) {
    const property = await propertyRepository.findPropertyById(propertyId);
    const isOwner = property?.ownerId === viewerId;
    if (!property || (property.status !== "active" && !isOwner))
        throw AppError_1.AppError.notFound("Property not found");
    const images = await propertyRepository.findImages(propertyId);
    const { coverFileName, ownerId, ...rest } = property;
    return {
        ...rest,
        coverImageUrl: coverFileName ? imageUrl(coverFileName) : null,
        images: images.map((image) => ({ id: image.id, url: imageUrl(image.fileName), position: image.position })),
        owner: { id: ownerId, name: property.ownerName },
        isOwner,
    };
}
const similarCache = new ttlCache_1.TtlCache(5 * 60 * 1000);
async function getSimilarProperties(propertyId) {
    const cached = similarCache.get(String(propertyId));
    if (cached)
        return cached;
    const target = await propertyRepository.findPropertyById(propertyId);
    if (!target || target.status !== "active")
        throw AppError_1.AppError.notFound("Property not found");
    const strict = await propertyRepository.findSimilarProperties(target, {
        minPrice: Math.floor(target.price * 0.75),
        maxPrice: Math.ceil(target.price * 1.25),
        sameType: true,
        excludeIds: [target.id],
        limit: SIMILAR_PROPERTIES_LIMIT,
    });
    let results = strict;
    if (results.length < SIMILAR_PROPERTIES_LIMIT) {
        const relaxed = await propertyRepository.findSimilarProperties(target, {
            minPrice: Math.floor(target.price * 0.5),
            maxPrice: Math.ceil(target.price * 1.5),
            sameType: false,
            excludeIds: [target.id, ...strict.map((row) => row.id)],
            limit: SIMILAR_PROPERTIES_LIMIT - results.length,
        });
        results = [...strict, ...relaxed];
    }
    const cards = results.map(toCard);
    similarCache.set(String(propertyId), cards);
    return cards;
}
async function createProperty(ownerId, input) {
    assertBusinessRules(input);
    const id = await propertyRepository.insertProperty(ownerId, input);
    return getPropertyDetail(id, ownerId);
}
async function updateProperty(propertyId, userId, changes) {
    await assertOwnership(propertyId, userId);
    const current = (await propertyRepository.findPropertyById(propertyId));
    assertBusinessRules({
        propertyType: changes.propertyType ?? current.propertyType,
        listingType: changes.listingType ?? current.listingType,
        price: changes.price ?? current.price,
        bedrooms: changes.bedrooms ?? current.bedrooms,
        bathrooms: changes.bathrooms ?? current.bathrooms,
    });
    await propertyRepository.updateProperty(propertyId, changes);
    return getPropertyDetail(propertyId, userId);
}
async function deleteProperty(propertyId, userId) {
    await assertOwnership(propertyId, userId);
    const fileNames = await propertyRepository.listImageFileNames(propertyId);
    await propertyRepository.deleteProperty(propertyId);
    await Promise.all(fileNames.map(removeUploadedFile));
}
async function removeUploadedFile(fileName) {
    await promises_1.default.unlink(node_path_1.default.join(uploadImages_1.uploadDirectory, node_path_1.default.basename(fileName))).catch(() => undefined);
}
async function addPropertyImages(propertyId, userId, files) {
    const uploadedNames = files.map((file) => file.filename);
    try {
        if (files.length === 0)
            throw AppError_1.AppError.badRequest("Attach at least one image (field name: images)");
        await assertOwnership(propertyId, userId);
        const existingCount = await propertyRepository.countImages(propertyId);
        if (existingCount + files.length > MAX_IMAGES_PER_PROPERTY) {
            throw AppError_1.AppError.badRequest(`A listing can have at most ${MAX_IMAGES_PER_PROPERTY} images`);
        }
        for (const file of files) {
            const detected = await (0, imageSignature_1.detectImageType)(file.path);
            if (!detected || detected.mime !== file.mimetype) {
                throw AppError_1.AppError.badRequest(`"${file.originalname}" is not a valid JPEG, PNG or WebP image`);
            }
        }
        await propertyRepository.insertImages(propertyId, uploadedNames);
    }
    catch (error) {
        await Promise.all(uploadedNames.map(removeUploadedFile));
        throw error;
    }
    const images = await propertyRepository.findImages(propertyId);
    return images.map((image) => ({ id: image.id, url: imageUrl(image.fileName), position: image.position }));
}
async function removePropertyImage(propertyId, imageId, userId) {
    await assertOwnership(propertyId, userId);
    const fileName = await propertyRepository.deleteImage(propertyId, imageId);
    if (!fileName)
        throw AppError_1.AppError.notFound("Image not found");
    await removeUploadedFile(fileName);
}
const getSitemapEntries = (limit) => propertyRepository.listForSitemap(limit);
exports.getSitemapEntries = getSitemapEntries;
