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
    author: row.author,
    sourceRef: row.sourceRef,
    sourceType: row.sourceType,
    tags: row.tags as string[],
    createdAt: row.createdAt.toISOString(),
  };
}

savedRouter.get("/saved", async (req, res) => {
  const userId = req.userId!;

  const bookmarked = await prisma.savedCitation.findMany({
    where: { userId },
    include: { citation: true },
  });

  const ownPrivate = await prisma.citation.findMany({
    where: { submittedByUserId: userId, status: "private" },
  });

  const byId = new Map<string, Citation>();
  for (const { citation } of bookmarked) byId.set(citation.id, citation);
  for (const citation of ownPrivate) byId.set(citation.id, citation);

  res.json([...byId.values()].map(toPublicCitation));
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
  await prisma.savedCitation.deleteMany({
    where: { userId: req.userId!, citationId },
  });
  res.status(204).send();
});
