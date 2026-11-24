import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env";
import { uploadDirectory } from "../../middleware/uploadImages";
import { AppError } from "../../utils/AppError";
import { decodeCursor, encodeCursor } from "../../utils/cursor";
import { detectImageType } from "../../utils/imageSignature";
import { TtlCache } from "../../utils/ttlCache";
import * as propertyRepository from "./property.repository";
import { PropertyCardRow } from "./property.repository";
import { CreatePropertyInput, SearchPropertiesQuery, UpdatePropertyInput } from "./property.schemas";

const MAX_IMAGES_PER_PROPERTY = 10;
const SIMILAR_PROPERTIES_LIMIT = 6;

const MAX_OFFSET_ROWS = 100_000;

const imageUrl = (fileName: string) => `${env.PUBLIC_API_URL}/uploads/${fileName}`;

function toCard(row: PropertyCardRow) {
  const { coverFileName, ...rest } = row;
  return { ...rest, coverImageUrl: coverFileName ? imageUrl(coverFileName) : null };
}

interface RuleSubject {
  propertyType: string;
  listingType: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
}

function assertBusinessRules(subject: RuleSubject) {
  const problems: { path: string; message: string; }[] = [];

  if (subject.propertyType === "plot" && (subject.bedrooms > 0 || subject.bathrooms > 0)) {
    problems.push({ path: "bedrooms", message: "A plot cannot have bedrooms or bathrooms" });
  }
  if (subject.listingType === "sale" && subject.price < 100_000) {
    problems.push({ path: "price", message: "Sale price must be at least 1,00,000" });
  }
  if (subject.listingType === "rent" && (subject.price < 500 || subject.price > 10_000_000)) {
    problems.push({ path: "price", message: "Monthly rent must be between 500 and 1,00,00,000" });
  }

  if (problems.length > 0) throw new AppError(400, "Validation failed", "VALIDATION_ERROR", problems);
}

async function assertOwnership(propertyId: number, userId: number) {
  const ownerId = await propertyRepository.findOwnerId(propertyId);
  if (ownerId === undefined) throw AppError.notFound("Property not found");
  if (ownerId !== userId) throw AppError.forbidden("You can only modify your own listings");
}

export async function searchProperties(filters: SearchPropertiesQuery, scope: propertyRepository.SearchScope = {}) {
  const usingCursor = Boolean(filters.cursor);

  if (!usingCursor && filters.page * filters.limit > MAX_OFFSET_ROWS) {
    throw AppError.badRequest(
      `Page ${filters.page} is too deep. Narrow your filters or use the "cursor" parameter instead of "page".`,
    );
  }

  const cursor = filters.cursor ? decodeCursor(filters.cursor) : undefined;

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
      nextCursor: hasNextPage && lastRow ? encodeCursor({ value: lastRow.sortValue, id: lastRow.id }) : null,
    },
  };
}

export const suggestProperties = (q: string) => propertyRepository.suggestProperties(q);

export async function getPropertyDetail(propertyId: number, viewerId?: number) {
  const property = await propertyRepository.findPropertyById(propertyId);
  const isOwner = property?.ownerId === viewerId;

  if (!property || (property.status !== "active" && !isOwner)) throw AppError.notFound("Property not found");

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

const similarCache = new TtlCache<ReturnType<typeof toCard>[]>(5 * 60 * 1000);

export async function getSimilarProperties(propertyId: number) {
  const cached = similarCache.get(String(propertyId));
  if (cached) return cached;

  const target = await propertyRepository.findPropertyById(propertyId);
  if (!target || target.status !== "active") throw AppError.notFound("Property not found");

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

export async function createProperty(ownerId: number, input: CreatePropertyInput) {
  assertBusinessRules(input);
  const id = await propertyRepository.insertProperty(ownerId, input);
  return getPropertyDetail(id, ownerId);
}

export async function updateProperty(propertyId: number, userId: number, changes: UpdatePropertyInput) {
  await assertOwnership(propertyId, userId);

  const current = (await propertyRepository.findPropertyById(propertyId))!;
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

export async function deleteProperty(propertyId: number, userId: number) {
  await assertOwnership(propertyId, userId);

  const fileNames = await propertyRepository.listImageFileNames(propertyId);
  await propertyRepository.deleteProperty(propertyId);
  await Promise.all(fileNames.map(removeUploadedFile));
}

async function removeUploadedFile(fileName: string) {

  await fs.unlink(path.join(uploadDirectory, path.basename(fileName))).catch(() => undefined);
}

export async function addPropertyImages(propertyId: number, userId: number, files: Express.Multer.File[]) {
  const uploadedNames = files.map((file) => file.filename);

  try {
    if (files.length === 0) throw AppError.badRequest("Attach at least one image (field name: images)");
    await assertOwnership(propertyId, userId);

    const existingCount = await propertyRepository.countImages(propertyId);
    if (existingCount + files.length > MAX_IMAGES_PER_PROPERTY) {
      throw AppError.badRequest(`A listing can have at most ${MAX_IMAGES_PER_PROPERTY} images`);
    }

    for (const file of files) {
      const detected = await detectImageType(file.path);
      if (!detected || detected.mime !== file.mimetype) {
        throw AppError.badRequest(`"${file.originalname}" is not a valid JPEG, PNG or WebP image`);
      }
    }

    await propertyRepository.insertImages(propertyId, uploadedNames);
  } catch (error) {

    await Promise.all(uploadedNames.map(removeUploadedFile));
    throw error;
  }

  const images = await propertyRepository.findImages(propertyId);
  return images.map((image) => ({ id: image.id, url: imageUrl(image.fileName), position: image.position }));
}

export async function removePropertyImage(propertyId: number, imageId: number, userId: number) {
  await assertOwnership(propertyId, userId);
  const fileName = await propertyRepository.deleteImage(propertyId, imageId);
  if (!fileName) throw AppError.notFound("Image not found");
  await removeUploadedFile(fileName);
}

export const getSitemapEntries = (limit: number) => propertyRepository.listForSitemap(limit);
