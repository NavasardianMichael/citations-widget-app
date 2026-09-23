import { pickBackgroundImageIndex } from "@/constants/widget-designs";
import { fetchCitations } from "@/services/api";
import {
  getCachedWidgetCitation,
  getGuestSavedCitations,
} from "@/services/local-storage";
import type { Citation, SourceSelection, WidgetCitation } from "@/types/citation";

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function toWidgetCitation(
  citation: Citation,
  backgroundImageIndex: number,
): WidgetCitation {
  return {
    ...citation,
    addedBy: null,
    addedByUrl: null,
    backgroundImageIndex,
  };
}

/**
 * Guest-mode counterpart of `GET /widget/citation`.
 *
 * The photo index rides along with every citation regardless of the design in
 * force: the snapshot falls back to image 0 when it is absent, so rolling it
 * only under sanctuary pinned any guest who switched design mid-window to the
 * first photo in the pool, and made the design switch itself look like what
 * changed the picture. It is excluded from repeating the photo already on the
 * widget.
 */
export async function pickGuestWidgetCitation(
  sourceSelection: SourceSelection,
): Promise<{ citation: WidgetCitation | null; reason?: string }> {
  const cached = await getCachedWidgetCitation();
  const backgroundImageIndex = pickBackgroundImageIndex(
    cached?.citation?.backgroundImageIndex,
  );

  if (sourceSelection === "saved") {
    const saved = await getGuestSavedCitations();
    const picked = pickRandom(saved);
    if (!picked) return { citation: null, reason: "empty_pool" };
    return { citation: toWidgetCitation(picked, backgroundImageIndex) };
  }

  const category = sourceSelection === "mixed" ? undefined : sourceSelection;
  const pool = await fetchCitations({ category, limit: 50 });
  const picked = pickRandom(pool);
  if (!picked) return { citation: null, reason: "empty_pool" };
  return { citation: toWidgetCitation(picked, backgroundImageIndex) };
}
