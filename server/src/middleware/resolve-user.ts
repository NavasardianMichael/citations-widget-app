import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { users } from "../db/schema.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

/**
 * V1 stand-in for real auth: the client generates a UUID once and persists it
 * locally, sending it as `x-device-id` on every request. This is the single
 * seam to replace with session/JWT/OAuth-based identity later — every route
 * downstream only ever reads `req.userId`.
 */
export function resolveUser(req: Request, res: Response, next: NextFunction) {
  const deviceId = req.header("x-device-id");
  if (!deviceId) {
    res.status(400).json({ error: "x-device-id header is required" });
    return;
  }

  const existing = db.select().from(users).where(eq(users.id, deviceId)).get();
  if (!existing) {
    db.insert(users).values({ id: deviceId }).run();
  }

  req.userId = deviceId;
  next();
}
