import { OAuth2Client } from "google-auth-library";
import { Router } from "express";
import passport from "passport";

import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { authLimiter } from "../middleware/rate-limiter.js";
import { requireAuth } from "../middleware/require-auth.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../middleware/error-handler.js";
import { userRepository } from "../repositories/user-repository.js";
import { refreshTokenRepository } from "../repositories/refresh-token-repository.js";
import { sessionRepository } from "../repositories/session-repository.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleMobileSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  updateAuthProfileSchema,
  verifyEmailSchema,
} from "../schemas/auth.js";
import { authService } from "../services/auth-service.js";
import { enforceSessionLimit, establishSession, issueAuthTokens } from "../services/auth-session.js";
import { ErrorCode, HttpStatus } from "../types/api.js";
import type { UserPublic } from "../types/auth.js";

const router = Router();
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

router.post("/register", authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post("/login", authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    await enforceSessionLimit(result.user.id, req.body.forceLogin);
    const session = await establishSession(req, result.user.id);
    res.json({
      success: true,
      data: {
        user: session.user,
        message: result.message,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/refresh", authLimiter, validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const record = await refreshTokenRepository.findValidByToken(req.body.refreshToken);
    if (!record) {
      throw new AppError(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_TOKEN, "Invalid or expired refresh token");
    }

    await refreshTokenRepository.revokeByToken(req.body.refreshToken);

    const user = await authService.getUserById(record.userId);
    if (!user) {
      throw new AppError(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, "User not found");
    }

    const tokens = await issueAuthTokens(req, user);
    res.json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        message: "Token refreshed",
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  const sessionId = req.sessionID;
  const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined;

  req.session.destroy(async (err) => {
    if (err) return next(err);

    res.clearCookie("citations.sid");

    if (refreshToken) {
      await refreshTokenRepository.revokeByToken(refreshToken).catch(() => undefined);
    }

    sessionRepository.deleteById(sessionId).catch((sessionErr) => {
      logger.error({ err: sessionErr }, "Failed to delete session record");
    });

    res.json({ success: true, data: { message: "Logged out successfully" } });
  });
});

router.get("/google", authLimiter, (req, res, next) => {
  const force = req.query.force === "true";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    ...(force && { state: "force" }),
  })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user, info) => {
    if (err || !user) {
      logger.error({ err, info }, "Google auth failed");
      return res.redirect(`${env.CLIENT_URL.replace(/\/$/, "")}/auth/login?error=google_auth_failed`);
    }

    const typedUser = user as UserPublic;

    try {
      const dbUser = await userRepository.findById(typedUser.id);
      if (!dbUser) {
        return res.redirect(`${env.CLIENT_URL.replace(/\/$/, "")}/auth/login?error=google_auth_failed`);
      }

      await enforceSessionLimit(typedUser.id, req.query.state === "force");
      await establishSession(req, typedUser.id);
      res.redirect(`${env.CLIENT_URL.replace(/\/$/, "")}/auth/callback`);
    } catch (error) {
      if (error instanceof AppError && error.code === ErrorCode.SESSION_LIMIT_REACHED) {
        return res.redirect(
          `${env.CLIENT_URL.replace(/\/$/, "")}/auth/login?error=session_limit&max=${env.MAX_CONCURRENT_SESSIONS}`,
        );
      }
      logger.error({ err: error }, "Google callback error");
      res.redirect(`${env.CLIENT_URL.replace(/\/$/, "")}/auth/login?error=google_auth_failed`);
    }
  })(req, res, next);
});

router.post("/google/mobile", authLimiter, validate(googleMobileSchema), async (req, res, next) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new AppError(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS, "Invalid Google token");
    }

    const user = await authService.findOrCreateGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      avatarUrl: payload.picture,
    });

    await enforceSessionLimit(user.id, req.body.forceLogin);
    const session = await establishSession(req, user.id);

    res.json({
      success: true,
      data: {
        user: session.user,
        message: "Login successful",
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.userId!);
    if (!user) {
      res.status(404).json({ success: false, error: { code: ErrorCode.NOT_FOUND, message: "User not found" } });
      return;
    }
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

router.patch("/profile", requireAuth, validate(updateAuthProfileSchema), async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.userId!, req.body);
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

router.post("/change-password", requireAuth, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.userId!, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", authLimiter, validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post("/resend-verification-email", authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      res.status(400).json({ success: false, error: { code: ErrorCode.VALIDATION_ERROR, message: "Email is required" } });
      return;
    }
    const result = await authService.resendVerification(email);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post("/verify-email", authLimiter, validate(verifyEmailSchema), async (req, res, next) => {
  try {
    const result = await authService.verifyEmail(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.delete("/account", requireAuth, authLimiter, async (req, res, next) => {
  try {
    const userId = req.userId!;
    await authService.deleteAccount(userId);

    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("citations.sid");
      res.json({ success: true, data: { message: "Account deleted successfully" } });
    });
  } catch (error) {
    next(error);
  }
});

export const authRouter = router;
