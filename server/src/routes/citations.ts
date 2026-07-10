import { randomUUID } from "node:crypto";
import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client.js";
import { citations } from "../db/schema.js";
import { resolveUser } from "../middleware/resolve-user.js";
import { HttpError } from "../middleware/error-handler.js";

export const citationsRouter = Router();

function toPublicCitation(row: typeof citations.$inferSelect) {
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    sourceRef: row.sourceRef,
    sourceType: row.sourceType,
    tags: row.tags,
    createdAt: row.createdAt,
  };
}

function toOwnedCitation(row: typeof citations.$inferSelect) {
  return {
    ...toPublicCitation(row),
    status: row.status,
    shareProfile: row.shareProfile,
    moderatorNote: row.moderatorNote,
    removableOnRequest: row.status === "approved",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const listQuerySchema = z.object({
  sourceType: z.enum(["bible", "fiction"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

citationsRouter.get("/citations", async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  const conditions = [eq(citations.status, "approved")];
  if (query.sourceType) conditions.push(eq(citations.sourceType, query.sourceType));

  const rows = await db
    .select()
    .from(citations)
    .where(and(...conditions))
    .orderBy(desc(citations.createdAt))
    .limit(query.limit)
    .offset(query.offset);

  res.json(rows.map(toPublicCitation));
});

const mineQuerySchema = z.object({
  status: z.enum(["all", "pending", "approved", "rejected", "private"]).default("all"),
});

// Registered before "/citations/:id" so "mine" isn't swallowed as an :id value.
citationsRouter.get("/citations/mine", resolveUser, async (req, res) => {
  const query = mineQuerySchema.parse(req.query);
  const conditions = [eq(citations.submittedByUserId, req.userId)];
  if (query.status !== "all") conditions.push(eq(citations.status, query.status));

  const rows = await db
    .select()
    .from(citations)
    .where(and(...conditions))
    .orderBy(desc(citations.createdAt));

  res.json(rows.map(toOwnedCitation));
});

citationsRouter.get("/citations/:id", async (req, res) => {
  const row = db
    .select()
    .from(citations)
    .where(and(eq(citations.id, req.params.id), eq(citations.status, "approved")))
    .get();
  if (!row) throw new HttpError(404, "Citation not found");
  res.json(toPublicCitation(row));
});

const createSchema = z.object({
  text: z.string().min(1).max(2000),
  author: z.string().min(1).max(200).optional(),
  sourceRef: z.string().min(1).max(200).optional(),
  sourceType: z.enum(["bible", "fiction"]),
  shareProfile: z.boolean().default(false),
  visibility: z.enum(["private", "pending"]),
});

citationsRouter.post("/citations", resolveUser, async (req, res) => {
  const body = createSchema.parse(req.body);
  const row = {
    id: randomUUID(),
    text: body.text,
    author: body.author ?? null,
    sourceRef: body.sourceRef ?? null,
    sourceType: body.sourceType,
    status: body.visibility,
    submittedByUserId: req.userId,
    shareProfile: body.shareProfile,
  };
  db.insert(citations).values(row).run();
  const created = db.select().from(citations).where(eq(citations.id, row.id)).get()!;
  res.status(201).json(toOwnedCitation(created));
});

const patchSchema = z.object({
  text: z.string().min(1).max(2000).optional(),
  author: z.string().min(1).max(200).nullable().optional(),
  sourceRef: z.string().min(1).max(200).nullable().optional(),
  tags: z.array(z.string()).optional(),
  shareProfile: z.boolean().optional(),
});

citationsRouter.patch("/citations/:id", resolveUser, async (req, res) => {
  const id = req.params.id as string;
  const existing = db.select().from(citations).where(eq(citations.id, id)).get();
  if (!existing) throw new HttpError(404, "Citation not found");
  if (existing.submittedByUserId !== req.userId) throw new HttpError(403, "You do not own this citation");

  const body = patchSchema.parse(req.body);
  // Content changed on a previously-approved item — it needs re-review.
  const nextStatus = existing.status === "approved" ? "pending" : existing.status;

  db.update(citations)
    .set({ ...body, status: nextStatus, updatedAt: new Date() })
    .where(eq(citations.id, id))
    .run();

  const updated = db.select().from(citations).where(eq(citations.id, id)).get()!;
  res.json(toOwnedCitation(updated));
});

citationsRouter.delete("/citations/:id", resolveUser, async (req, res) => {
  const id = req.params.id as string;
  const existing = db.select().from(citations).where(eq(citations.id, id)).get();
  if (!existing) throw new HttpError(404, "Citation not found");
  if (existing.submittedByUserId !== req.userId) throw new HttpError(403, "You do not own this citation");

  db.delete(citations).where(eq(citations.id, id)).run();
  res.status(204).send();
});
