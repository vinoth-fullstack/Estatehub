import { Router } from "express";
import { query } from "../../config/database";
import { asyncHandler } from "../../utils/asyncHandler";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    try {
      await query("SELECT 1");
      res.json({ status: "ok", database: "up", uptimeSeconds: Math.round(process.uptime()) });
    } catch {
      res.status(503).json({ status: "degraded", database: "down" });
    }
  }),
);
