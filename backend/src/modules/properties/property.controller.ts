import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as propertyService from "./property.service";

const PUBLIC_CACHE = "public, max-age=30, stale-while-revalidate=60";

export const listProperties = asyncHandler(async (req: Request, res: Response) => {
  res.set("Cache-Control", PUBLIC_CACHE);
  res.json(await propertyService.searchProperties(req.query as never));
});

export const listMyProperties = asyncHandler(async (req: Request, res: Response) => {
  res.set("Cache-Control", "private, no-store");
  res.json(await propertyService.searchProperties(req.query as never, { ownerId: req.user!.id }));
});

export const suggestProperties = asyncHandler(async (req: Request, res: Response) => {
  res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  const { q } = req.query as { q: string; };
  res.json({ data: await propertyService.suggestProperties(q) });
});

export const getSitemap = asyncHandler(async (req: Request, res: Response) => {
  res.set("Cache-Control", "public, max-age=3600");
  res.json({ data: await propertyService.getSitemapEntries((req.query as never as { limit: number; }).limit) });
});

export const getProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.getPropertyDetail((req.params as never as { id: number; }).id, req.user?.id);

  res.set("Cache-Control", req.user ? "private, no-store" : PUBLIC_CACHE);
  res.json({ data: property });
});

export const getSimilarProperties = asyncHandler(async (req: Request, res: Response) => {
  res.set("Cache-Control", PUBLIC_CACHE);
  res.json({ data: await propertyService.getSimilarProperties((req.params as never as { id: number; }).id) });
});

export const createProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.createProperty(req.user!.id, req.body);
  res.status(201).json({ data: property });
});

export const updateProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.updateProperty((req.params as never as { id: number; }).id, req.user!.id, req.body);
  res.json({ data: property });
});

export const deleteProperty = asyncHandler(async (req: Request, res: Response) => {
  await propertyService.deleteProperty((req.params as never as { id: number; }).id, req.user!.id);
  res.status(204).send();
});

export const uploadImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const images = await propertyService.addPropertyImages((req.params as never as { id: number; }).id, req.user!.id, files);
  res.status(201).json({ data: images });
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const { id, imageId } = req.params as never as { id: number; imageId: number; };
  await propertyService.removePropertyImage(id, imageId, req.user!.id);
  res.status(204).send();
});
