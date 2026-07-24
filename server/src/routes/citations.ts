import { randomUUID } from "node:crypto";
import type { Citation } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db/index.js";
import { HttpError } from "../middleware/error-handler.js";
import { requireAuth } from "../middleware/require-auth.js";

export const citationsRouter = Router();

function toPublicCitation(row: Citation) {
  return {
    id: row.id,
    text: row.text,
    source: row.source,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
  };
}

function toOwnedCitation(row: Citation) {
  return {
    ...toPublicCitation(row),
    status: row.status,
    shareProfile: row.shareProfile,
    moderatorNote: row.moderatorNote,
    removableOnRequest: row.status === "approved",
    updatedAt: row.updatedAt.toISOString(),
  };
}

const listQuerySchema = z.object({
  category: z.enum(["bible", "fiction"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

citationsRouter.get("/citations", async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  const rows = await prisma.citation.findMany({
    where: {
      status: "approved",
      ...(query.category && { category: query.category }),
    },
    orderBy: { createdAt: "desc" },
    take: query.limit,
    skip: query.offset,
  });
  res.json(rows.map(toPublicCitation));
});

const mineQuerySchema = z.object({
  status: z.enum(["all", "pending", "approved", "rejected", "private"]).default("all"),
});

citationsRouter.get("/citations/mine", requireAuth, async (req, res) => {
  const query = mineQuerySchema.parse(req.query);
  const rows = await prisma.citation.findMany({
    where: {
      submittedByUserId: req.userId!,
      ...(query.status !== "all" && { status: query.status }),
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(rows.map(toOwnedCitation));
});

citationsRouter.get("/citations/:id", async (req, res) => {
  const row = await prisma.citation.findFirst({
    where: { id: String(req.params.id), status: "approved" },
  });
  if (!row) throw new HttpError(404, "Citation not found");
  res.json(toPublicCitation(row));
});

const createSchema = z.object({
  text: z.string().min(1).max(400),
  source: z.string().min(1).max(200),
  category: z.enum(["bible", "fiction"]),
  shareProfile: z.boolean().default(false),
  visibility: z.enum(["private", "pending"]),
});

citationsRouter.post("/citations", requireAuth, async (req, res) => {
  const body = createSchema.parse(req.body);
  const created = await prisma.citation.create({
    data: {
      id: randomUUID(),
      text: body.text,
      source: body.source,
      category: body.category,
      status: body.visibility,
      submittedByUserId: req.userId!,
      shareProfile: body.shareProfile,
    },
  });
  res.status(201).json(toOwnedCitation(created));
});

const patchSchema = z.object({
  text: z.string().min(1).max(400).optional(),
  source: z.string().min(1).max(200).optional(),
  category: z.enum(["bible", "fiction"]).optional(),
  shareProfile: z.boolean().optional(),
});

citationsRouter.patch("/citations/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const existing = await prisma.citation.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Citation not found");
  if (existing.submittedByUserId !== req.userId) throw new HttpError(403, "You do not own this citation");

  const body = patchSchema.parse(req.body);
  const nextStatus = existing.status === "approved" ? "pending" : existing.status;

  const updated = await prisma.citation.update({
    where: { id },
    data: {
      ...body,
      status: nextStatus,
    },
  });

  res.json(toOwnedCitation(updated));
});

citationsRouter.delete("/citations/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const existing = await prisma.citation.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Citation not found");
  if (existing.submittedByUserId !== req.userId) throw new HttpError(403, "You do not own this citation");

  await prisma.citation.delete({ where: { id } });
  res.status(204).send();
});
