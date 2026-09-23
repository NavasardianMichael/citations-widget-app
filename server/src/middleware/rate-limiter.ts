import rateLimit from "express-rate-limit";

import { env } from "../config/env.js";

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Չափազանց շատ հարցումներ։ Խնդրում ենք փորձել մի փոքր ուշ",
    },
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Մուտքի չափազանց շատ փորձեր։ Խնդրում ենք փորձել մի փոքր ուշ",
    },
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
