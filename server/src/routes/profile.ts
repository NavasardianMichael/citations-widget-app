import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { resolveUser } from "../middleware/resolve-user.js";

export const profileRouter = Router();
profileRouter.use(resolveUser);

profileRouter.get("/profile", async (req, res) => {
  // resolveUser already find-or-creates this row.
  const user = db.select().from(users).where(eq(users.id, req.userId)).get()!;
  res.json(user);
});

const patchSchema = z.object({
  firstName: z.string().min(1).max(100).nullable().optional(),
  lastName: z.string().min(1).max(100).nullable().optional(),
  socialUrl: z.string().url().max(300).nullable().optional(),
});

profileRouter.patch("/profile", async (req, res) => {
  const body = patchSchema.parse(req.body);
  db.update(users).set({ ...body, updatedAt: new Date() }).where(eq(users.id, req.userId)).run();
  res.json(db.select().from(users).where(eq(users.id, req.userId)).get());
});
