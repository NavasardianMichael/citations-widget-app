import type { EmailVerificationToken } from "@prisma/client";
import crypto from "crypto";

import { prisma } from "../db/index.js";

const TOKEN_EXPIRY_HOURS = 48;

export const emailVerificationRepository = {
  generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  },

  async create(userId: string): Promise<EmailVerificationToken> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.emailVerificationToken.deleteMany({
      where: { userId, usedAt: null },
    });

    return prisma.emailVerificationToken.create({
      data: { token, userId, expiresAt },
    });
  },

  async findValidToken(
    token: string,
  ): Promise<(EmailVerificationToken & { user: { id: string; email: string; name: string } }) | null> {
    return prisma.emailVerificationToken.findFirst({
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

  async findByTokenWithUser(token: string) {
    return prisma.emailVerificationToken.findFirst({
      where: { token },
      include: {
        user: {
          select: { id: true, email: true, name: true, emailVerified: true },
        },
      },
    });
  },

  async markAsUsed(id: string): Promise<void> {
    await prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },
};
