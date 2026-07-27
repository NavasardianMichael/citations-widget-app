import type { Citation } from "@prisma/client";
import { Router } from "express";

import { prisma } from "../db/index.js";
import { requireAuth } from "../middleware/require-auth.js";

export const savedRouter = Router();
savedRouter.use(requireAuth);

function toPublicCitation(row: Citation) {
  return {
    id: row.id,
    text: row.text,
    source: row.source,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
  };
}

savedRouter.get("/saved", async (req, res) => {
  const userId = req.userId!;

  // Bookmarks only. Own private/pending submissions are listed via /citations/mine
  // under their status filters — not duplicated here.
  const bookmarked = await prisma.savedCitation.findMany({
    where: { userId },
    include: { citation: true },
  });

  res.json(bookmarked.map(({ citation }) => toPublicCitation(citation)));
});

savedRouter.post("/saved/:citationId", async (req, res) => {
  const citationId = String(req.params.citationId);
  const citation = await prisma.citation.findUnique({ where: { id: citationId } });
  if (!citation) {
    res.status(404).json({ error: "Citation not found" });
    return;
  }

  await prisma.savedCitation.upsert({
    where: {
      userId_citationId: { userId: req.userId!, citationId },
    },
    create: { userId: req.userId!, citationId },
    update: {},
  });

  res.status(201).json({ saved: true });
});

savedRouter.delete("/saved/:citationId", async (req, res) => {
  const citationId = String(req.params.citationId);
  const userId = req.userId!;

  await prisma.savedCitation.deleteMany({
    where: { userId, citationId },
  });

  // If a private custom was bookmarked (or an older client unsaves one), delete it.
  await prisma.citation.deleteMany({
    where: { id: citationId, submittedByUserId: userId, status: "private" },
  });

  res.status(204).send();
});
