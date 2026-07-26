import { Router } from "express";
import { z } from "zod";

import { logger } from "../lib/logger.js";
import { authLimiter } from "../middleware/rate-limiter.js";
import { emailService } from "../services/email-service.js";

export const contactRouter = Router();

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(4000),
});

contactRouter.post("/contact", authLimiter, async (req, res) => {
  const body = contactSchema.parse(req.body);

  try {
    await emailService.sendContactMessage({
      name: body.name,
      email: body.email,
      message: body.message,
    });
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ error, email: body.email }, "Failed to send contact message");
    res.status(502).json({
      success: false,
      error: { message: "Failed to send message" },
    });
  }
});
