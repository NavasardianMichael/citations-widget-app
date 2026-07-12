import { ErrorCode, HttpStatus } from "../types/api.js";
import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";

import { AppError } from "./error-handler.js";

type ValidationTarget = "body" | "query" | "params";

export function validate<T>(schema: ZodSchema<T>, target: ValidationTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[target]);
      req[target] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join(".");
          if (!details[path]) details[path] = [];
          details[path].push(issue.message);
        }
        next(
          new AppError(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_ERROR, "Validation failed", details),
        );
        return;
      }
      next(error);
    }
  };
}
