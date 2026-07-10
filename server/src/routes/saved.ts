import { Router } from "express";
import { and, eq, or } from "drizzle-orm";

import { db } from "../db/client.js";
import { citations, savedCitations } from "../db/schema.js";
import { resolveUser } from "../middleware/resolve-user.js";

export const savedRouter = Router();
savedRouter.use(resolveUser);

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

// The Saved screen shows the union of: citations the user explicitly bookmarked,
// plus the user's own "private" (save-to-custom-list) submissions — those never
// get a redundant separate bookmark row, they just always belong on this screen.
savedRouter.get("/saved", async (req, res) => {
  const bookmarked = await db
    .select({ citation: citations })
    .from(savedCitations)
    .innerJoin(citations, eq(savedCitations.citationId, citations.id))
    .where(eq(savedCitations.userId, req.userId));

  const ownPrivate = await db
    .select()
    .from(citations)
    .where(and(eq(citations.submittedByUserId, req.userId), eq(citations.status, "private")));

  const byId = new Map<string, typeof citations.$inferSelect>();
  for (const { citation } of bookmarked) byId.set(citation.id, citation);
  for (const citation of ownPrivate) byId.set(citation.id, citation);

  res.json([...byId.values()].map(toPublicCitation));
});

savedRouter.post("/saved/:citationId", async (req, res) => {
  const citation = db.select().from(citations).where(eq(citations.id, req.params.citationId)).get();
  if (!citation) {
    res.status(404).json({ error: "Citation not found" });
    return;
  }

  db.insert(savedCitations)
    .values({ userId: req.userId, citationId: req.params.citationId })
    .onConflictDoNothing()
    .run();
  res.status(201).json({ saved: true });
});

savedRouter.delete("/saved/:citationId", async (req, res) => {
  db.delete(savedCitations)
    .where(and(eq(savedCitations.userId, req.userId), eq(savedCitations.citationId, req.params.citationId)))
    .run();
  res.status(204).send();
});
