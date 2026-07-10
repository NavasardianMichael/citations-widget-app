import { Router } from "express";
import { sql } from "drizzle-orm";

import { db } from "../db/client.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  let dbStatus: "ok" | "error" = "ok";
  try {
    db.get(sql`SELECT 1`);
  } catch {
    dbStatus = "error";
  }
  res.json({ status: "ok", service: "citations-widget-api", db: dbStatus });
});
