import { prisma } from "../db/index.js";

export type SessionCreate = {
  id: string;
  userId: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export const sessionRepository = {
  async create(data: SessionCreate): Promise<void> {
    await prisma.session.create({ data });
  },

  async deleteById(id: string): Promise<void> {
    try {
      await prisma.session.delete({ where: { id } });
    } catch {
      // ignore
    }
  },
};
