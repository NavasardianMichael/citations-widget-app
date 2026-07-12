import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db/index.js";
import { requireAuth } from "../middleware/require-auth.js";
import { pickCitationForPool } from "../services/widget-citation-picker.js";

export const widgetRouter = Router();
widgetRouter.use(requireAuth);

function serializeWidgetSettings(row: Awaited<ReturnType<typeof getOrCreateSettings>>) {
  return {
    userId: row.userId,
    sourceSelection: row.sourceSelection,
    refreshRateHours: row.refreshRateHours,
    fontStyle: row.fontStyle,
    showAttribution: row.showAttribution,
    currentCitationId: row.currentCitationId,
    currentCitationSetAt: row.currentCitationSetAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getOrCreateSettings(userId: string) {
  const existing = await prisma.widgetSettings.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.widgetSettings.create({ data: { userId } });
}

widgetRouter.get("/widget-settings", async (req, res) => {
  const settings = await getOrCreateSettings(req.userId!);
  res.json(serializeWidgetSettings(settings));
});

const settingsSchema = z.object({
  sourceSelection: z.enum(["bible", "fiction", "mixed", "saved"]),
  refreshRateHours: z.union([z.literal(6), z.literal(12), z.literal(24)]),
  fontStyle: z.enum(["source_serif_4", "hanken_grotesk"]),
  showAttribution: z.boolean(),
});

widgetRouter.put("/widget-settings", async (req, res) => {
  const body = settingsSchema.parse(req.body);
  await getOrCreateSettings(req.userId!);
  const updated = await prisma.widgetSettings.update({
    where: { userId: req.userId! },
    data: body,
  });
  res.json(serializeWidgetSettings(updated));
});

async function withAttribution(citation: NonNullable<Awaited<ReturnType<typeof pickCitationForPool>>>, showAttribution: boolean) {
  const base = {
    id: citation.id,
    text: citation.text,
    author: citation.author,
    sourceRef: citation.sourceRef,
    sourceType: citation.sourceType,
    tags: citation.tags as string[],
  };

  if (!showAttribution || !citation.shareProfile || !citation.submittedByUserId) {
    return { ...base, addedBy: null };
  }

  const submitter = await prisma.user.findUnique({ where: { id: citation.submittedByUserId } });
  const name = [submitter?.firstName, submitter?.lastName].filter(Boolean).join(" ");
  return { ...base, addedBy: name || submitter?.name || null };
}

widgetRouter.get("/widget/citation", async (req, res) => {
  const settings = await getOrCreateSettings(req.userId!);
  const force = req.query.force === "true";
  const rotationElapsed =
    !settings.currentCitationSetAt ||
    Date.now() - settings.currentCitationSetAt.getTime() >= settings.refreshRateHours * 60 * 60 * 1000;

  let current =
    settings.currentCitationId && !force && !rotationElapsed
      ? await prisma.citation.findUnique({ where: { id: settings.currentCitationId } })
      : null;

  if (!current) {
    current = await pickCitationForPool(settings.sourceSelection, req.userId!);
    await prisma.widgetSettings.update({
      where: { userId: req.userId! },
      data: {
        currentCitationId: current?.id ?? null,
        currentCitationSetAt: new Date(),
      },
    });
  }

  if (!current) {
    res.json({ citation: null, reason: "empty_pool" });
    return;
  }

  res.json({ citation: await withAttribution(current, settings.showAttribution) });
});

const previewSchema = z.object({
  sourceSelection: z.enum(["bible", "fiction", "mixed", "saved"]),
  fontStyle: z.enum(["source_serif_4", "hanken_grotesk"]),
  showAttribution: z.boolean(),
});

widgetRouter.post("/widget/preview", async (req, res) => {
  const body = previewSchema.parse(req.body);
  const picked = await pickCitationForPool(body.sourceSelection, req.userId!);
  if (!picked) {
    res.json({ citation: null, reason: "empty_pool" });
    return;
  }
  res.json({ citation: await withAttribution(picked, body.showAttribution) });
});
