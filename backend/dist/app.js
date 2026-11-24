"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const openapi_1 = require("./docs/openapi");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiters_1 = require("./middleware/rateLimiters");
const uploadImages_1 = require("./middleware/uploadImages");
const auth_routes_1 = require("./modules/auth/auth.routes");
const health_routes_1 = require("./modules/health/health.routes");
const inquiry_routes_1 = require("./modules/inquiries/inquiry.routes");
const property_routes_1 = require("./modules/properties/property.routes");
function createApp() {
    const app = (0, express_1.default)();
    app.set("trust proxy", env_1.env.TRUST_PROXY);
    app.disable("x-powered-by");
    app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
    app.use((0, cors_1.default)({ origin: env_1.env.CLIENT_ORIGIN, credentials: true }));
    app.use((0, compression_1.default)());
    if (env_1.env.NODE_ENV !== "test")
        app.use((0, morgan_1.default)(env_1.env.NODE_ENV === "production" ? "combined" : "dev"));
    app.use(express_1.default.json({ limit: "100kb" }));
    app.use((0, cookie_parser_1.default)());
    app.use("/uploads", express_1.default.static(uploadImages_1.uploadDirectory, { maxAge: "7d", immutable: true }));
    app.use("/api-docs", (_req, res, next) => {
        res.removeHeader("Content-Security-Policy");
        next();
    }, swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi_1.openApiDocument, { customSiteTitle: "EstateHub API Docs" }));
    app.get("/api-docs.json", (_req, res) => res.json(openapi_1.openApiDocument));
    app.use("/api", rateLimiters_1.apiLimiter);
    app.use("/api/health", health_routes_1.healthRouter);
    app.use("/api/auth", auth_routes_1.authRouter);
    app.use("/api/properties/:propertyId/inquiries", inquiry_routes_1.propertyInquiryRouter);
    app.use("/api/properties", property_routes_1.propertyRouter);
    app.use("/api/inquiries", inquiry_routes_1.inquiryRouter);
    app.use(errorHandler_1.notFoundHandler);
    app.use(errorHandler_1.errorHandler);
    return app;
}
