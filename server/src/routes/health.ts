import { Router } from "express";

import { prisma } from "../db/index.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", service: "citations-widget-api", db: "ok" });
  } catch {
    res.status(503).json({ status: "error", service: "citations-widget-api", db: "error" });
  }
});
