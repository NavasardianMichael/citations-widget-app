import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db/index.js";
import { requireAuth } from "../middleware/require-auth.js";

export const profileRouter = Router();
profileRouter.use(requireAuth);

function serializeProfile(user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    socialUrl: user.socialUrl,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

profileRouter.get("/profile", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) {
    res.status(404).json({ success: false, error: { message: "User not found" } });
    return;
  }
  res.json(serializeProfile(user));
});

const patchSchema = z.object({
  firstName: z.string().min(1).max(100).nullable().optional(),
  lastName: z.string().min(1).max(100).nullable().optional(),
  socialUrl: z.string().url().max(300).nullable().optional(),
});

profileRouter.patch("/profile", async (req, res) => {
  const body = patchSchema.parse(req.body);
  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: body,
  });
  res.json(serializeProfile(updated));
});
