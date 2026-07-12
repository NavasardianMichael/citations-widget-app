import type { SourceSelection } from "@prisma/client";

import { prisma } from "../db/index.js";

async function pickBySourceType(sourceType: "bible" | "fiction") {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM citations
    WHERE status = 'approved' AND source_type = ${sourceType}::"SourceType"
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

export async function pickCitationForPool(pool: SourceSelection, userId: string) {
  if (pool === "saved") {
    return (await pickFromSaved(userId)) ?? null;
  }
  if (pool === "mixed") {
    const first = Math.random() < 0.5 ? "bible" : "fiction";
    const second = first === "bible" ? "fiction" : "bible";
    return (await pickBySourceType(first)) ?? (await pickBySourceType(second)) ?? null;
  }
  return (await pickBySourceType(pool)) ?? null;
}
