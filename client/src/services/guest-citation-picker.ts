import { fetchCitations } from "@/services/api";
import { getGuestSavedCitations } from "@/services/local-storage";
import type { SourceSelection, WidgetCitation } from "@/types/citation";

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

export async function pickGuestWidgetCitation(
  sourceSelection: SourceSelection,
): Promise<{ citation: WidgetCitation | null; reason?: string }> {
  if (sourceSelection === "saved") {
    const saved = await getGuestSavedCitations();
    const picked = pickRandom(saved);
    if (!picked) return { citation: null, reason: "empty_pool" };
    return { citation: { ...picked, addedBy: null } };
  }

  const category = sourceSelection === "mixed" ? undefined : sourceSelection;
  const pool = await fetchCitations({ category, limit: 50 });
  const picked = pickRandom(pool);
  if (!picked) return { citation: null, reason: "empty_pool" };
  return { citation: { ...picked, addedBy: null } };
}
