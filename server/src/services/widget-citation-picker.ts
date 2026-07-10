import { and, eq, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { citations, savedCitations } from "../db/schema.js";

export type SourceSelection = "bible" | "fiction" | "mixed" | "saved";

function pickBySourceType(sourceType: "bible" | "fiction") {
  return db
    .select()
    .from(citations)
    .where(and(eq(citations.status, "approved"), eq(citations.sourceType, sourceType)))
    .orderBy(sql`RANDOM()`)
    .limit(1)
    .get();
}

function pickFromSaved(userId: string) {
  return db
    .select({ citation: citations })
    .from(savedCitations)
    .innerJoin(citations, eq(savedCitations.citationId, citations.id))
    .where(eq(savedCitations.userId, userId))
    .orderBy(sql`RANDOM()`)
    .limit(1)
    .get()?.citation;
}

/**
 * "Mixed" deliberately does NOT `ORDER BY RANDOM()` over the raw union of
 * bible+fiction rows: with a large seeded KJV set vs. a handful of fiction
 * quotes, a naive union-random would be Bible in practice nearly every time.
 * Coin-flip the pool first, then pick within it, falling back to the other
 * pool if the chosen one happens to be empty.
 */
export function pickCitationForPool(pool: SourceSelection, userId: string) {
  if (pool === "saved") {
    return pickFromSaved(userId) ?? null;
  }
  if (pool === "mixed") {
    const first = Math.random() < 0.5 ? "bible" : "fiction";
    const second = first === "bible" ? "fiction" : "bible";
    return pickBySourceType(first) ?? pickBySourceType(second) ?? null;
  }
  return pickBySourceType(pool) ?? null;
}
