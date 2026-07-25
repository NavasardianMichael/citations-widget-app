import type { FontStyle, SourceSelection, WidgetDesign } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db/index.js";
import { requireAuth } from "../middleware/require-auth.js";
import { pickCitationForPool } from "../services/widget-citation-picker.js";

export const widgetRouter = Router();
widgetRouter.use(requireAuth);

/** Keep in sync with client `WIDGET_BACKGROUND_IMAGES` / sanctuary random pool. */
const WIDGET_BACKGROUND_IMAGE_COUNT = 3;
const FONT_SIZE_MIN = 13;
const FONT_SIZE_MAX = 22;

/** Design that rolls a fresh photo from the pool on each new citation (not citation-owned). */
const RANDOM_BACKGROUND_DESIGN = "sanctuary";

const WIDGET_DESIGNS = [
  "classic",
  "parchment",
  "midnight",
  "glass",
  "ink",
  "manuscript",
  "sanctuary",
] as const;

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
  const existing = await prisma.widgetSettings.findUnique({ where: { userId } });
  if (existing) return existing as WidgetSettingsRow;

  return (await prisma.widgetSettings.create({ data: { userId } })) as WidgetSettingsRow;
}

widgetRouter.get("/widget-settings", async (req, res) => {
  const settings = await getOrCreateSettings(req.userId!);
  res.json(serializeWidgetSettings(settings));
});

const FONT_STYLES = [
  "vrdznagir",
  "braind_amanor",
  "artsakh",
  "davel_aghvor",
  "mardoto",
  "arti",
  "arian_grqi",
  "braind_zbans",
  "nortar_body",
  "arm_hmks_script",
  "noyemi",
  "armeniapedia_garun",
  "armeniapedia_geghagrutyun",
  "sasuntsi",
  "armeniapedia_jhapaven",
] as const;

const settingsSchema = z.object({
  sourceSelection: z.enum(["bible", "fiction", "mixed", "saved"]),
  refreshRateHours: z.union([z.literal(6), z.literal(12), z.literal(24)]),
  fontStyle: z.enum(FONT_STYLES),
  fontSize: z.number().int().min(FONT_SIZE_MIN).max(FONT_SIZE_MAX),
  widgetDesign: z.enum(WIDGET_DESIGNS),
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

  if (!showAttribution || !citation.shareProfile || !citation.submittedByUserId) {
    return { ...base, addedBy: null };
  }

  const submitter = await prisma.user.findUnique({ where: { id: citation.submittedByUserId } });
  return { ...base, addedBy: submitter?.name ?? null };
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
  sourceSelection: z.enum(["bible", "fiction", "mixed", "saved"]),
  fontStyle: z.enum(FONT_STYLES),
  widgetDesign: z.enum(WIDGET_DESIGNS).optional(),
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
