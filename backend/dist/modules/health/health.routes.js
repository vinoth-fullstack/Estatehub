"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const database_1 = require("../../config/database");
const asyncHandler_1 = require("../../utils/asyncHandler");
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get("/", (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    try {
        await (0, database_1.query)("SELECT 1");
        res.json({ status: "ok", database: "up", uptimeSeconds: Math.round(process.uptime()) });
    }
    catch {
        res.status(503).json({ status: "degraded", database: "down" });
    }
}));
