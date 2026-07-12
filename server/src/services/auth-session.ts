import type { Request } from "express";

import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { signAccessToken } from "../lib/tokens.js";
import { AppError } from "../middleware/error-handler.js";
import { refreshTokenRepository } from "../repositories/refresh-token-repository.js";
import { sessionRepository } from "../repositories/session-repository.js";
import { authService } from "../services/auth-service.js";
import { ErrorCode, HttpStatus } from "../types/api.js";
import type { UserPublic } from "../types/auth.js";

export async function enforceSessionLimit(userId: string, forceLogin?: boolean): Promise<void> {
  await sessionRepository.deleteExpiredByUserId(userId);
  const sessionCount = await sessionRepository.countActiveByUserId(userId);
  const sessionLimit = env.MAX_CONCURRENT_SESSIONS;

  if (sessionCount >= sessionLimit) {
    if (forceLogin) {
      await sessionRepository.deleteAllSessionsByUserId(userId);
      await refreshTokenRepository.revokeAllForUser(userId);
    } else {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        ErrorCode.SESSION_LIMIT_REACHED,
        `Your account is already active on ${sessionCount} device${sessionCount === 1 ? "" : "s"}. Please log out from another device first.`,
        { sessionLimit: [String(sessionLimit)] },
      );
    }
  }
}

export async function issueAuthTokens(req: Request, user: UserPublic) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const { token: refreshToken } = await refreshTokenRepository.create({
    userId: user.id,
    userAgent: req.headers["user-agent"] ?? null,
    ipAddress: req.ip ?? null,
  });

  return { accessToken, refreshToken };
}

export function establishSession(
  req: Request,
  userId: string,
): Promise<{ accessToken: string; refreshToken: string; user: UserPublic }> {
  return new Promise((resolve, reject) => {
    req.session.regenerate(async (err) => {
      if (err) return reject(err);

      try {
        req.session.userId = userId;

        const expiresAt = new Date(Date.now() + env.SESSION_MAX_AGE);
        sessionRepository
          .create({
            id: req.sessionID,
            userId,
            expiresAt,
            userAgent: req.headers["user-agent"] ?? null,
            ipAddress: req.ip ?? null,
          })
          .catch((sessionErr) => logger.error({ err: sessionErr }, "Failed to create session record"));

        const user = await authService.getUserById(userId);
        if (!user) return reject(new Error("User not found after login"));

        const tokens = await issueAuthTokens(req, user);
        resolve({ ...tokens, user });
      } catch (error) {
        reject(error);
      }
    });
  });
}
