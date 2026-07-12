import type { PasswordResetToken } from "@prisma/client";
import crypto from "crypto";

import { prisma } from "../db/index.js";

const TOKEN_EXPIRY_MINUTES = 30;

export const passwordResetRepository = {
  generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  },

  async create(userId: string): Promise<PasswordResetToken> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({
      where: { userId, usedAt: null },
    });

    return prisma.passwordResetToken.create({
      data: { token, userId, expiresAt },
    });
  },

  async findValidToken(
    token: string,
  ): Promise<(PasswordResetToken & { user: { id: string; email: string; name: string } }) | null> {
    return prisma.passwordResetToken.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });
  },

  async markAsUsed(id: string): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },
};
