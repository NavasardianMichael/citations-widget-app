import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../lib/tokens.js";
import { ErrorCode, HttpStatus } from "../types/api.js";
import { AppError } from "./error-handler.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (payload?.sub) {
      req.userId = payload.sub;
      next();
      return;
    }
  }

  if (req.session?.userId) {
    req.userId = req.session.userId;
    next();
    return;
  }

  next(new AppError(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, "Authentication required"));
}
