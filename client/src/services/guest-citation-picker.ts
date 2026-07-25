import { pickBackgroundImageIndex } from "@/constants/widget-designs";
import { fetchCitations } from "@/services/api";
import { getGuestSavedCitations } from "@/services/local-storage";
import type { Citation, SourceSelection, WidgetCitation } from "@/types/citation";

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function toWidgetCitation(citation: Citation): WidgetCitation {
  return { ...citation, addedBy: null, backgroundImageIndex: pickBackgroundImageIndex() };
}

export async function pickGuestWidgetCitation(
  sourceSelection: SourceSelection,
): Promise<{ citation: WidgetCitation | null; reason?: string }> {
  console.log("[widget-citation] pickGuestWidgetCitation", { sourceSelection });

  if (sourceSelection === "saved") {
    const saved = await getGuestSavedCitations();
    const picked = pickRandom(saved);
    console.log("[widget-citation] guest saved pool", {
      poolSize: saved.length,
      pickedId: picked?.id ?? null,
    });
    if (!picked) return { citation: null, reason: "empty_pool" };
    return { citation: toWidgetCitation(picked) };
  }

  const category = sourceSelection === "mixed" ? undefined : sourceSelection;
  const pool = await fetchCitations({ category, limit: 50 });
  const picked = pickRandom(pool);
  console.log("[widget-citation] guest API pool", {
    category: category ?? "all",
    poolSize: pool.length,
    pickedId: picked?.id ?? null,
    textPreview: picked?.text?.slice(0, 80) ?? null,
  });
  if (!picked) return { citation: null, reason: "empty_pool" };
  return { citation: toWidgetCitation(picked) };
}
