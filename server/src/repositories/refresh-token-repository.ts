import type { RefreshToken } from "@prisma/client";

import { env } from "../config/env.js";
import { prisma } from "../db/index.js";
import { generateRefreshToken, hashRefreshToken } from "../lib/tokens.js";

export const refreshTokenRepository = {
  async create(params: {
    userId: string;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<{ token: string; record: RefreshToken }> {
    const token = generateRefreshToken();
    const tokenHash = hashRefreshToken(token);
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_SECONDS * 1000);

    const record = await prisma.refreshToken.create({
      data: {
        userId: params.userId,
        tokenHash,
        expiresAt,
        userAgent: params.userAgent ?? null,
        ipAddress: params.ipAddress ?? null,
      },
    });

    return { token, record };
  },

  async findValidByToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = hashRefreshToken(token);
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  },

  async revokeByToken(token: string): Promise<void> {
    const tokenHash = hashRefreshToken(token);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
