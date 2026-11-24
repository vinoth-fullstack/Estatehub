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
exports.deleteImage = exports.uploadImages = exports.deleteProperty = exports.updateProperty = exports.createProperty = exports.getSimilarProperties = exports.getProperty = exports.getSitemap = exports.suggestProperties = exports.listMyProperties = exports.listProperties = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const propertyService = __importStar(require("./property.service"));
const PUBLIC_CACHE = "public, max-age=30, stale-while-revalidate=60";
exports.listProperties = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.set("Cache-Control", PUBLIC_CACHE);
    res.json(await propertyService.searchProperties(req.query));
});
exports.listMyProperties = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.set("Cache-Control", "private, no-store");
    res.json(await propertyService.searchProperties(req.query, { ownerId: req.user.id }));
});
exports.suggestProperties = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    const { q } = req.query;
    res.json({ data: await propertyService.suggestProperties(q) });
});
exports.getSitemap = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.set("Cache-Control", "public, max-age=3600");
    res.json({ data: await propertyService.getSitemapEntries(req.query.limit) });
});
exports.getProperty = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const property = await propertyService.getPropertyDetail(req.params.id, req.user?.id);
    res.set("Cache-Control", req.user ? "private, no-store" : PUBLIC_CACHE);
    res.json({ data: property });
});
exports.getSimilarProperties = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.set("Cache-Control", PUBLIC_CACHE);
    res.json({ data: await propertyService.getSimilarProperties(req.params.id) });
});
exports.createProperty = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const property = await propertyService.createProperty(req.user.id, req.body);
    res.status(201).json({ data: property });
});
exports.updateProperty = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const property = await propertyService.updateProperty(req.params.id, req.user.id, req.body);
    res.json({ data: property });
});
exports.deleteProperty = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await propertyService.deleteProperty(req.params.id, req.user.id);
    res.status(204).send();
});
exports.uploadImages = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const files = req.files ?? [];
    const images = await propertyService.addPropertyImages(req.params.id, req.user.id, files);
    res.status(201).json({ data: images });
});
exports.deleteImage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id, imageId } = req.params;
    await propertyService.removePropertyImage(id, imageId, req.user.id);
    res.status(204).send();
});
