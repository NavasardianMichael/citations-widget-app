import type { Citation, SourceSelection } from "@prisma/client";

import { prisma } from "../db/index.js";

async function pickByCategory(category: "bible" | "fiction") {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM citations
    WHERE status = 'approved' AND category = ${category}::"CitationCategory"
    ORDER BY RANDOM()
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return prisma.citation.findUnique({ where: { id: rows[0].id } });
}

async function pickFromSaved(userId: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT c.id FROM saved_citations sc
    INNER JOIN citations c ON c.id = sc.citation_id
    WHERE sc.user_id = ${userId}
    ORDER BY RANDOM()
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return prisma.citation.findUnique({ where: { id: rows[0].id } });
}

/** Whether a sticky/current citation still belongs in the active widget pool. */
export async function citationMatchesPool(
  citation: Citation,
  pool: SourceSelection,
  userId: string,
): Promise<boolean> {
  if (pool === "saved") {
    const saved = await prisma.savedCitation.findFirst({
      where: { userId, citationId: citation.id },
      select: { userId: true },
    });
    return !!saved;
  }
  if (citation.status !== "approved") return false;
  if (pool === "mixed") {
    return citation.category === "bible" || citation.category === "fiction";
  }
  return citation.category === pool;
}

export async function pickCitationForPool(pool: SourceSelection, userId: string) {
  if (pool === "saved") {
    return (await pickFromSaved(userId)) ?? null;
  }
  if (pool === "mixed") {
    const first = Math.random() < 0.5 ? "bible" : "fiction";
    const second = first === "bible" ? "fiction" : "bible";
    return (await pickByCategory(first)) ?? (await pickByCategory(second)) ?? null;
  }
  return (await pickByCategory(pool)) ?? null;
}
