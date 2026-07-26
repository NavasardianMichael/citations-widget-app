import { randomUUID } from "node:crypto";
import type { Citation, User } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db/index.js";
import { logger } from "../lib/logger.js";
import { HttpError } from "../middleware/error-handler.js";
import { requireAuth } from "../middleware/require-auth.js";
import { emailService } from "../services/email-service.js";

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
    moderatorNote: row.moderatorNote,
    removableOnRequest: row.status === "approved",
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Fire-and-forget internal review email for pending submissions. */
async function notifyCitationPendingReview(citation: Citation, submitter: User) {
  try {
    await emailService.sendCitationPendingReview({
      citationId: citation.id,
      status: citation.status,
      category: citation.category,
      source: citation.source,
      text: citation.text,
      submittedAt: citation.updatedAt.toISOString(),
      submitterUserId: submitter.id,
      submitterName: submitter.name,
      submitterEmail: submitter.email,
      submitterSocialUrl: submitter.socialUrl,
      submitterShareProfile: submitter.shareProfile,
    });
  } catch (error) {
    logger.error(
      { error, citationId: citation.id, userId: submitter.id },
      "Failed to send citation pending-review email",
    );
  }
}

async function notifyCitationPendingWithdrawn(citation: Citation, submitter: User) {
  try {
    await emailService.sendCitationPendingWithdrawn({
      citationId: citation.id,
      status: citation.status,
      category: citation.category,
      source: citation.source,
      text: citation.text,
      submittedAt: citation.createdAt.toISOString(),
      submitterUserId: submitter.id,
      submitterName: submitter.name,
      submitterEmail: submitter.email,
      submitterSocialUrl: submitter.socialUrl,
      submitterShareProfile: submitter.shareProfile,
    });
  } catch (error) {
    logger.error(
      { error, citationId: citation.id, userId: submitter.id },
      "Failed to send citation pending-withdrawn email",
    );
  }
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
  status: z.enum(["all", "pending", "approved", "private"]).default("all"),
});

citationsRouter.get("/citations/mine", requireAuth, async (req, res) => {
  const query = mineQuerySchema.parse(req.query);
  const rows = await prisma.citation.findMany({
    where: {
      submittedByUserId: req.userId!,
      // Rejected rows are deleted after manual notice — never return them.
      status: query.status === "all" ? { not: "rejected" } : query.status,
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
  visibility: z.enum(["private", "pending"]),
});

citationsRouter.post("/citations", requireAuth, async (req, res) => {
  const body = createSchema.parse(req.body);
  const userId = req.userId!;
  const created = await prisma.citation.create({
    data: {
      id: randomUUID(),
      text: body.text,
      source: body.source,
      category: body.category,
      status: body.visibility,
      submittedByUserId: userId,
    },
  });

  if (created.status === "pending") {
    const submitter = await prisma.user.findUnique({ where: { id: userId } });
    if (submitter) {
      void notifyCitationPendingReview(created, submitter);
    }
  }

  res.status(201).json(toOwnedCitation(created));
});

const patchSchema = z.object({
  text: z.string().min(1).max(400).optional(),
  source: z.string().min(1).max(200).optional(),
  category: z.enum(["bible", "fiction"]).optional(),
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

  // Editing an approved citation sends it back for review.
  if (existing.status === "approved" && updated.status === "pending") {
    const submitter = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (submitter) {
      void notifyCitationPendingReview(updated, submitter);
    }
  }

  res.json(toOwnedCitation(updated));
});

citationsRouter.delete("/citations/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId!;
  const existing = await prisma.citation.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Citation not found");
  if (existing.submittedByUserId !== userId) throw new HttpError(403, "You do not own this citation");

  const wasPending = existing.status === "pending";
  const submitter = wasPending
    ? await prisma.user.findUnique({ where: { id: userId } })
    : null;

  // Hard-delete: bookmarks cascade; widget currentCitationId is SetNull.
  await prisma.citation.delete({ where: { id } });

  if (wasPending && submitter) {
    void notifyCitationPendingWithdrawn(existing, submitter);
  }

  res.status(204).send();
});
