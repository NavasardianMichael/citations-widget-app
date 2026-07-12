import { ErrorCode, HttpStatus } from "../types/api.js";
import { isDev } from "../config/env.js";
import { logger } from "../lib/logger.js";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

function isPayloadTooLargeError(err: Error): boolean {
  const withType = err as Error & { type?: string; status?: number; statusCode?: number };
  return (
    withType.type === "entity.too.large" ||
    withType.status === HttpStatus.PAYLOAD_TOO_LARGE ||
    withType.statusCode === HttpStatus.PAYLOAD_TOO_LARGE
  );
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCode.NOT_FOUND,
      message: `Not found: ${req.method} ${req.path}`,
    },
  });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err }, "Request error");

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      success: false,
      error: {
        code: err.status === 403 ? ErrorCode.FORBIDDEN : ErrorCode.NOT_FOUND,
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: "Invalid request",
        details: err.flatten().fieldErrors as Record<string, string[]>,
      },
    });
    return;
  }

  if (isPayloadTooLargeError(err)) {
    res.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      success: false,
      error: {
        code: ErrorCode.PAYLOAD_TOO_LARGE,
        message: "Request body is too large",
      },
    });
    return;
  }

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "An unexpected error occurred",
      ...(isDev && { devMessage: err.message }),
    },
  });
}
