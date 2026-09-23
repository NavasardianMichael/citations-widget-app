import {
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  FONT_STYLE_IDS,
  REFRESH_RATE_HOURS,
  SOURCE_SELECTION_IDS,
  WIDGET_DESIGN_IDS,
  isWidgetRefreshDue,
  rollBackgroundImageIndex,
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
    z.literal(REFRESH_RATE_HOURS[3]),
  ]),
  fontStyle: z.enum(FONT_STYLE_IDS),
  fontSize: z.number().int().min(FONT_SIZE_MIN).max(FONT_SIZE_MAX),
  widgetDesign: z.enum(WIDGET_DESIGN_IDS),
  showAttribution: z.boolean(),
  showActions: z.boolean(),
});

widgetRouter.put("/widget-settings", async (req, res) => {
  const body = settingsSchema.parse(req.body);
  // Row must exist before the update below; the values are not read back.
  await getOrCreateSettings(req.userId!);

  // `currentBackgroundImageIndex` is deliberately absent here. It belongs to the
  // citation window, not to the settings: re-rolling it on a save (which this
  // route used to do when switching into sanctuary) made the photo change
  // because the user touched a font or a source, with the same quote still on
  // the widget. Only `/widget/citation` moves it, and only with a new citation.
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
    return { ...base, addedBy: null, addedByUrl: null };
  }

  const submitter = await prisma.user.findUnique({
    where: { id: citation.submittedByUserId },
  });
  if (!submitter?.shareProfile) {
    return { ...base, addedBy: null, addedByUrl: null };
  }

  const name = submitter.name.trim();
  if (!name) {
    return { ...base, addedBy: null, addedByUrl: null };
  }
  const socialUrl = submitter.socialUrl?.trim() || null;
  return {
    ...base,
    // Name only — clients turn this into a link when addedByUrl is set.
    addedBy: name,
    addedByUrl: socialUrl,
  };
}

widgetRouter.get("/widget/citation", async (req, res) => {
  const settings = await getOrCreateSettings(req.userId!);
  const force = req.query.force === "true";
  const rotationElapsed =
    !settings.currentCitationSetAt ||
    isWidgetRefreshDue(
      settings.currentCitationSetAt.getTime(),
      settings.refreshRateHours,
    );

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

  let backgroundImageIndex = settings.currentBackgroundImageIndex;

  if (!current) {
    current = await pickCitationForPool(settings.sourceSelection, req.userId!);
    // Roll for every new citation window, whatever the design is set to today.
    // Rolling only under sanctuary left the index parked at whatever a solid
    // design last wrote, so switching over mid-window showed that same photo
    // until the quote happened to rotate. The index is not bound to a citation
    // id — it is simply this window's pick.
    backgroundImageIndex = rollBackgroundImageIndex(
      settings.currentBackgroundImageIndex,
    );
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
    // Sent whatever the design is. Withholding it outside sanctuary made the
    // client fall back to image 0 (or roll its own, disagreeing with what the
    // home widget would show) the moment someone previewed the photo design.
    citation: await withAttribution(
      current,
      settings.showAttribution,
      backgroundImageIndex,
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
  const picked = await pickCitationForPool(body.sourceSelection, req.userId!);
  if (!picked) {
    res.json({ citation: null, reason: "empty_pool" });
    return;
  }
  // A different citation than the committed one, so a fresh photo goes with it.
  // Non-committing: nothing here writes `currentBackgroundImageIndex`.
  res.json({
    citation: await withAttribution(
      picked,
      body.showAttribution,
      rollBackgroundImageIndex(settings.currentBackgroundImageIndex),
    ),
  });
});
