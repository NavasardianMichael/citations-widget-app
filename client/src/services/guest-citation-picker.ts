import {
  designUsesRandomBackground,
  pickBackgroundImageIndex,
  type WidgetDesignId,
} from "@/constants/widget-designs";
import { fetchCitations } from "@/services/api";
import {
  getGuestSavedCitations,
  getGuestWidgetSettings,
} from "@/services/local-storage";
import type { Citation, SourceSelection, WidgetCitation } from "@/types/citation";

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function toWidgetCitation(
  citation: Citation,
  designId: WidgetDesignId,
): WidgetCitation {
  return {
    ...citation,
    addedBy: null,
    ...(designUsesRandomBackground(designId)
      ? { backgroundImageIndex: pickBackgroundImageIndex() }
      : {}),
  };
}

export async function pickGuestWidgetCitation(
  sourceSelection: SourceSelection,
  designId?: WidgetDesignId,
): Promise<{ citation: WidgetCitation | null; reason?: string }> {
  const settings = designId
    ? { widgetDesign: designId }
    : await getGuestWidgetSettings();
  const widgetDesign = settings.widgetDesign;

  if (sourceSelection === "saved") {
    const saved = await getGuestSavedCitations();
    const picked = pickRandom(saved);
    if (!picked) return { citation: null, reason: "empty_pool" };
    return { citation: toWidgetCitation(picked, widgetDesign) };
  }

  const category = sourceSelection === "mixed" ? undefined : sourceSelection;
  const pool = await fetchCitations({ category, limit: 50 });
  const picked = pickRandom(pool);
  if (!picked) return { citation: null, reason: "empty_pool" };
  return { citation: toWidgetCitation(picked, widgetDesign) };
}
