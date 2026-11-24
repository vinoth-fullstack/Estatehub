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
exports.propertyRouter = void 0;
const express_1 = require("express");
const authenticate_1 = require("../../middleware/authenticate");
const rateLimiters_1 = require("../../middleware/rateLimiters");
const uploadImages_1 = require("../../middleware/uploadImages");
const validateRequest_1 = require("../../middleware/validateRequest");
const propertyController = __importStar(require("./property.controller"));
const property_schemas_1 = require("./property.schemas");
exports.propertyRouter = (0, express_1.Router)();
exports.propertyRouter.get("/", (0, validateRequest_1.validateRequest)({ query: property_schemas_1.searchPropertiesQuerySchema }), propertyController.listProperties);
exports.propertyRouter.get("/suggestions", (0, validateRequest_1.validateRequest)({ query: property_schemas_1.suggestionsQuerySchema }), propertyController.suggestProperties);
exports.propertyRouter.get("/mine", authenticate_1.requireAuth, (0, validateRequest_1.validateRequest)({ query: property_schemas_1.searchPropertiesQuerySchema }), propertyController.listMyProperties);
exports.propertyRouter.get("/sitemap", (0, validateRequest_1.validateRequest)({ query: property_schemas_1.sitemapQuerySchema }), propertyController.getSitemap);
exports.propertyRouter.get("/:id", authenticate_1.optionalAuth, (0, validateRequest_1.validateRequest)({ params: property_schemas_1.propertyIdParamSchema }), propertyController.getProperty);
exports.propertyRouter.get("/:id/similar", (0, validateRequest_1.validateRequest)({ params: property_schemas_1.propertyIdParamSchema }), propertyController.getSimilarProperties);
exports.propertyRouter.post("/", authenticate_1.requireAuth, (0, validateRequest_1.validateRequest)({ body: property_schemas_1.createPropertySchema }), propertyController.createProperty);
exports.propertyRouter.put("/:id", authenticate_1.requireAuth, (0, validateRequest_1.validateRequest)({ params: property_schemas_1.propertyIdParamSchema, body: property_schemas_1.updatePropertySchema }), propertyController.updateProperty);
exports.propertyRouter.delete("/:id", authenticate_1.requireAuth, (0, validateRequest_1.validateRequest)({ params: property_schemas_1.propertyIdParamSchema }), propertyController.deleteProperty);
exports.propertyRouter.post("/:id/images", authenticate_1.requireAuth, rateLimiters_1.uploadLimiter, (0, validateRequest_1.validateRequest)({ params: property_schemas_1.propertyIdParamSchema }), uploadImages_1.uploadPropertyImages, propertyController.uploadImages);
exports.propertyRouter.delete("/:id/images/:imageId", authenticate_1.requireAuth, (0, validateRequest_1.validateRequest)({ params: property_schemas_1.propertyImageParamSchema }), propertyController.deleteImage);
