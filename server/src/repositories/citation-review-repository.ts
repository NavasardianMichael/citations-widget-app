import type { CitationReviewAction, CitationReviewToken } from "@prisma/client";
import crypto from "crypto";

import { prisma } from "../db/index.js";

const TOKEN_EXPIRY_DAYS = 14;

export const citationReviewRepository = {
  generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  },

  /** Creates a fresh approve + reject token pair; invalidates any prior unused tokens. */
  async createPair(citationId: string): Promise<{
    approve: CitationReviewToken;
    reject: CitationReviewToken;
  }> {
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await prisma.citationReviewToken.deleteMany({
      where: { citationId, usedAt: null },
    });

    const [approve, reject] = await prisma.$transaction([
      prisma.citationReviewToken.create({
        data: {
          token: this.generateToken(),
          citationId,
          action: "approve",
          expiresAt,
        },
      }),
      prisma.citationReviewToken.create({
        data: {
          token: this.generateToken(),
          citationId,
          action: "reject",
          expiresAt,
        },
      }),
    ]);

    return { approve, reject };
  },

  async findValidToken(token: string) {
    return prisma.citationReviewToken.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        citation: {
          include: {
            submittedBy: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });
  },

  async markPairUsed(citationId: string): Promise<void> {
    await prisma.citationReviewToken.updateMany({
      where: { citationId, usedAt: null },
      data: { usedAt: new Date() },
    });
  },
};

export type ReviewTokenWithCitation = NonNullable<
  Awaited<ReturnType<typeof citationReviewRepository.findValidToken>>
>;

export type { CitationReviewAction };
