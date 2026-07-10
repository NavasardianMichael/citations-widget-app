import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db/client.js";
import { citations, users, widgetSettings } from "../db/schema.js";
import { resolveUser } from "../middleware/resolve-user.js";
import { pickCitationForPool } from "../services/widget-citation-picker.js";

export const widgetRouter = Router();
widgetRouter.use(resolveUser);

function getOrCreateSettings(userId: string) {
  const existing = db.select().from(widgetSettings).where(eq(widgetSettings.userId, userId)).get();
  if (existing) return existing;

  db.insert(widgetSettings).values({ userId }).run();
  return db.select().from(widgetSettings).where(eq(widgetSettings.userId, userId)).get()!;
}

widgetRouter.get("/widget-settings", async (req, res) => {
  res.json(getOrCreateSettings(req.userId));
});

const settingsSchema = z.object({
  sourceSelection: z.enum(["bible", "fiction", "mixed", "saved"]),
  refreshRateHours: z.union([z.literal(6), z.literal(12), z.literal(24)]),
  fontStyle: z.enum(["source_serif_4", "hanken_grotesk"]),
  showAttribution: z.boolean(),
});

widgetRouter.put("/widget-settings", async (req, res) => {
  const body = settingsSchema.parse(req.body);
  getOrCreateSettings(req.userId); // ensure the row exists before updating
  db.update(widgetSettings).set({ ...body, updatedAt: new Date() }).where(eq(widgetSettings.userId, req.userId)).run();
  res.json(db.select().from(widgetSettings).where(eq(widgetSettings.userId, req.userId)).get());
});

function withAttribution(citation: typeof citations.$inferSelect, showAttribution: boolean) {
  const base = {
    id: citation.id,
    text: citation.text,
    author: citation.author,
    sourceRef: citation.sourceRef,
    sourceType: citation.sourceType,
    tags: citation.tags,
  };

  if (!showAttribution || !citation.shareProfile || !citation.submittedByUserId) {
    return { ...base, addedBy: null };
  }

  const submitter = db.select().from(users).where(eq(users.id, citation.submittedByUserId)).get();
  const name = [submitter?.firstName, submitter?.lastName].filter(Boolean).join(" ");
  return { ...base, addedBy: name || null };
}

widgetRouter.get("/widget/citation", async (req, res) => {
  const settings = getOrCreateSettings(req.userId);
  const force = req.query.force === "true";
  const rotationElapsed =
    !settings.currentCitationSetAt ||
    Date.now() - settings.currentCitationSetAt.getTime() >= settings.refreshRateHours * 60 * 60 * 1000;

  let current =
    settings.currentCitationId && !force && !rotationElapsed
      ? db.select().from(citations).where(eq(citations.id, settings.currentCitationId)).get()
      : undefined;

  if (!current) {
    current = pickCitationForPool(settings.sourceSelection, req.userId) ?? undefined;
    db.update(widgetSettings)
      .set({ currentCitationId: current?.id ?? null, currentCitationSetAt: new Date() })
      .where(eq(widgetSettings.userId, req.userId))
      .run();
  }

  if (!current) {
    res.json({ citation: null, reason: "empty_pool" });
    return;
  }

  res.json({ citation: withAttribution(current, settings.showAttribution) });
});

const previewSchema = z.object({
  sourceSelection: z.enum(["bible", "fiction", "mixed", "saved"]),
  fontStyle: z.enum(["source_serif_4", "hanken_grotesk"]),
  showAttribution: z.boolean(),
});

// Backs the Settings screen's live preview, which reflects in-progress (unsaved)
// form edits — it must NOT touch persisted rotation state the way /widget/citation does.
widgetRouter.post("/widget/preview", async (req, res) => {
  const body = previewSchema.parse(req.body);
  const picked = pickCitationForPool(body.sourceSelection, req.userId);
  if (!picked) {
    res.json({ citation: null, reason: "empty_pool" });
    return;
  }
  res.json({ citation: withAttribution(picked, body.showAttribution) });
});
