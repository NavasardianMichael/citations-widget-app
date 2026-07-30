import {
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  FONT_STYLE_IDS,
  RANDOM_BACKGROUND_DESIGN,
  REFRESH_RATE_HOURS,
  SOURCE_SELECTION_IDS,
  WIDGET_BACKGROUND_IMAGE_COUNT,
  WIDGET_DESIGN_IDS,
} from "@citations/shared";
import type { FontStyle, SourceSelection, WidgetDesign } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db/index.js";
import { requireAuth } from "../middleware/require-auth.js";
import { pickCitationForPool, citationMatchesPool } from "../services/widget-citation-picker.js";

export const widgetRouter = Router();
widgetRouter.use(requireAuth);

/**
 * Explicit row shape matching `schema.prisma` WidgetSettings.
 * Avoids inferring from a stale generated Prisma client in the IDE.
 */
type WidgetSettingsRow = {
  userId: string;
  sourceSelection: SourceSelection;
  refreshRateHours: number;
  fontStyle: FontStyle;
  fontSize: number;
  widgetDesign: WidgetDesign;
  showAttribution: boolean;
  showActions: boolean;
  currentCitationId: string | null;
  currentCitationSetAt: Date | null;
  currentBackgroundImageIndex: number;
  updatedAt: Date;
};

/** Compare via string so this stays valid even if the local Prisma client lags the schema. */
function isRandomBackgroundDesign(design: string): boolean {
  return design === RANDOM_BACKGROUND_DESIGN;
}

function pickBackgroundImageIndex(): number {
  return Math.floor(Math.random() * WIDGET_BACKGROUND_IMAGE_COUNT);
}

function serializeWidgetSettings(row: WidgetSettingsRow) {
  return {
    userId: row.userId,
    sourceSelection: row.sourceSelection,
    refreshRateHours: row.refreshRateHours,
    fontStyle: row.fontStyle,
    fontSize: row.fontSize,
    widgetDesign: row.widgetDesign,
    showAttribution: row.showAttribution,
    showActions: row.showActions,
    currentCitationId: row.currentCitationId,
    currentCitationSetAt: row.currentCitationSetAt?.toISOString() ?? null,
    currentBackgroundImageIndex: row.currentBackgroundImageIndex,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getOrCreateSettings(userId: string): Promise<WidgetSettingsRow> {
  // Upsert: first Google/email login often fans out several authenticated GETs
  // (citations library + guest migration) that all need settings at once. A
  // find-then-create race used to throw P2002 → opaque 500 on the citations page.
  return (await prisma.widgetSettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })) as WidgetSettingsRow;
}

widgetRouter.get("/widget-settings", async (req, res) => {
  const settings = await getOrCreateSettings(req.userId!);
  res.json(serializeWidgetSettings(settings));
});

const settingsSchema = z.object({
  sourceSelection: z.enum(SOURCE_SELECTION_IDS),
  refreshRateHours: z.union([
    z.literal(REFRESH_RATE_HOURS[0]),
    z.literal(REFRESH_RATE_HOURS[1]),
    z.literal(REFRESH_RATE_HOURS[2]),
  ]),
  fontStyle: z.enum(FONT_STYLE_IDS),
  fontSize: z.number().int().min(FONT_SIZE_MIN).max(FONT_SIZE_MAX),
  widgetDesign: z.enum(WIDGET_DESIGN_IDS),
  showAttribution: z.boolean(),
  showActions: z.boolean(),
});

widgetRouter.put("/widget-settings", async (req, res) => {
  const body = settingsSchema.parse(req.body);
  const previous = await getOrCreateSettings(req.userId!);
  const switchingToSanctuary =
    isRandomBackgroundDesign(body.widgetDesign) &&
    !isRandomBackgroundDesign(previous.widgetDesign);

  const updated = (await prisma.widgetSettings.update({
    where: { userId: req.userId! },
    data: {
      sourceSelection: body.sourceSelection,
      refreshRateHours: body.refreshRateHours,
      fontStyle: body.fontStyle,
      fontSize: body.fontSize,
      widgetDesign: body.widgetDesign,
      showAttribution: body.showAttribution,
      showActions: body.showActions,
      ...(switchingToSanctuary
        ? { currentBackgroundImageIndex: pickBackgroundImageIndex() }
        : {}),
    } as Parameters<typeof prisma.widgetSettings.update>[0]["data"],
  })) as WidgetSettingsRow;

  res.json(serializeWidgetSettings(updated));
});

async function withAttribution(
  citation: NonNullable<Awaited<ReturnType<typeof pickCitationForPool>>>,
  showAttribution: boolean,
  backgroundImageIndex?: number,
) {
  const base = {
    id: citation.id,
    text: citation.text,
    source: citation.source,
    category: citation.category,
    ...(backgroundImageIndex !== undefined ? { backgroundImageIndex } : {}),
  };

  if (!showAttribution || !citation.submittedByUserId) {
    return { ...base, addedBy: null };
  }

  const submitter = await prisma.user.findUnique({
    where: { id: citation.submittedByUserId },
  });
  if (!submitter?.shareProfile) {
    return { ...base, addedBy: null };
  }

  const name = submitter.name.trim();
  const socialUrl = submitter.socialUrl?.trim();
  return {
    ...base,
    addedBy: socialUrl ? `${name} · ${socialUrl}` : name || null,
  };
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

  // Drop sticky citation if it no longer matches the pool (e.g. bible wipe left a
  // fiction id sticky, or status changed away from approved).
  if (
    current &&
    !(await citationMatchesPool(current, settings.sourceSelection, req.userId!))
  ) {
    current = null;
  }

  const usesRandomBackground = isRandomBackgroundDesign(settings.widgetDesign);
  let backgroundImageIndex = settings.currentBackgroundImageIndex;

  if (!current) {
    current = await pickCitationForPool(settings.sourceSelection, req.userId!);
    // Re-roll only for sanctuary, and only when assigning a new citation window —
    // the index is not permanently bound to the citation id.
    backgroundImageIndex = usesRandomBackground ? pickBackgroundImageIndex() : 0;
    await prisma.widgetSettings.update({
      where: { userId: req.userId! },
      data: {
        currentCitationId: current?.id ?? null,
        currentCitationSetAt: new Date(),
        currentBackgroundImageIndex: backgroundImageIndex,
      } as Parameters<typeof prisma.widgetSettings.update>[0]["data"],
    });
  }

  if (!current) {
    res.json({ citation: null, reason: "empty_pool" });
    return;
  }

  res.json({
    citation: await withAttribution(
      current,
      settings.showAttribution,
      usesRandomBackground ? backgroundImageIndex : undefined,
    ),
  });
});

const previewSchema = z.object({
  sourceSelection: z.enum(SOURCE_SELECTION_IDS),
  fontStyle: z.enum(FONT_STYLE_IDS),
  widgetDesign: z.enum(WIDGET_DESIGN_IDS).optional(),
  showAttribution: z.boolean(),
});

widgetRouter.post("/widget/preview", async (req, res) => {
  const body = previewSchema.parse(req.body);
  const settings = await getOrCreateSettings(req.userId!);
  const design = body.widgetDesign ?? settings.widgetDesign;
  const picked = await pickCitationForPool(body.sourceSelection, req.userId!);
  if (!picked) {
    res.json({ citation: null, reason: "empty_pool" });
    return;
  }
  const randomIndex = isRandomBackgroundDesign(design)
    ? pickBackgroundImageIndex()
    : undefined;
  res.json({
    citation: await withAttribution(picked, body.showAttribution, randomIndex),
  });
});
