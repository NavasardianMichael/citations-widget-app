import { Router } from "express";
import { z } from "zod";

import { AUTH_VALIDATION } from "../constants/validation.js";
import { prisma } from "../db/index.js";
import { requireAuth } from "../middleware/require-auth.js";

export const profileRouter = Router();
profileRouter.use(requireAuth);

function serializeProfile(user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    socialUrl: user.socialUrl,
    avatarUrl: user.avatarUrl,
    locale: user.locale ?? "hy",
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
  name: z
    .string()
    .min(AUTH_VALIDATION.name.minLength, AUTH_VALIDATION.name.messages.minLength)
    .max(AUTH_VALIDATION.name.maxLength, AUTH_VALIDATION.name.messages.maxLength)
    .regex(AUTH_VALIDATION.name.pattern, AUTH_VALIDATION.name.messages.pattern)
    .optional(),
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
