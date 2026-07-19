import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEFAULT_WIDGET_DESIGN, isWidgetDesignId } from "@/constants/widget-designs";
import { DEFAULT_WIDGET_FONT } from "@/fonts/registry";
import type { Citation, SourceSelection, WidgetCitation, WidgetSettingsDraft } from "@/types/citation";

const GUEST_MODE_KEY = "citations_guest_mode";
const GUEST_WIDGET_SETTINGS_KEY = "citations_guest_widget_settings";
const GUEST_SAVED_CITATIONS_KEY = "citations_guest_saved_citations";
const WIDGET_CITATION_CACHE_KEY = "citations_widget_citation_cache";

const DEFAULT_GUEST_WIDGET_SETTINGS: WidgetSettingsDraft = {
  sourceSelection: "mixed",
  refreshRateHours: 24,
  fontStyle: DEFAULT_WIDGET_FONT,
  widgetDesign: DEFAULT_WIDGET_DESIGN,
  showAttribution: true,
  showActions: true,
};

export type CachedWidgetCitation = {
  citation: WidgetCitation | null;
  fetchedAt: number;
  sourceSelection: SourceSelection;
};

export async function isGuestMode(): Promise<boolean> {
  return (await AsyncStorage.getItem(GUEST_MODE_KEY)) === "true";
}

export async function setGuestMode(value: boolean): Promise<void> {
  if (value) {
    await AsyncStorage.setItem(GUEST_MODE_KEY, "true");
  } else {
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
  }
}

export async function getGuestWidgetSettings(): Promise<WidgetSettingsDraft> {
  const raw = await AsyncStorage.getItem(GUEST_WIDGET_SETTINGS_KEY);
  if (!raw) return DEFAULT_GUEST_WIDGET_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<WidgetSettingsDraft>;
    return {
      ...DEFAULT_GUEST_WIDGET_SETTINGS,
      ...parsed,
      widgetDesign: isWidgetDesignId(parsed.widgetDesign)
        ? parsed.widgetDesign
        : DEFAULT_WIDGET_DESIGN,
    };
  } catch {
    return DEFAULT_GUEST_WIDGET_SETTINGS;
  }
}

export async function saveGuestWidgetSettings(draft: WidgetSettingsDraft): Promise<void> {
  await AsyncStorage.setItem(GUEST_WIDGET_SETTINGS_KEY, JSON.stringify(draft));
}

export async function getGuestSavedCitations(): Promise<Citation[]> {
  const raw = await AsyncStorage.getItem(GUEST_SAVED_CITATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveGuestSavedCitation(citation: Citation): Promise<void> {
  const existing = await getGuestSavedCitations();
  if (existing.some((c) => c.id === citation.id)) return;
  await AsyncStorage.setItem(GUEST_SAVED_CITATIONS_KEY, JSON.stringify([...existing, citation]));
}

export async function removeGuestSavedCitation(id: string): Promise<void> {
  const existing = await getGuestSavedCitations();
  await AsyncStorage.setItem(GUEST_SAVED_CITATIONS_KEY, JSON.stringify(existing.filter((c) => c.id !== id)));
}

export async function getCachedWidgetCitation(): Promise<CachedWidgetCitation | null> {
  const raw = await AsyncStorage.getItem(WIDGET_CITATION_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setCachedWidgetCitation(cache: CachedWidgetCitation): Promise<void> {
  await AsyncStorage.setItem(WIDGET_CITATION_CACHE_KEY, JSON.stringify(cache));
}

export async function hasGuestData(): Promise<boolean> {
  const [settingsRaw, citations] = await Promise.all([
    AsyncStorage.getItem(GUEST_WIDGET_SETTINGS_KEY),
    getGuestSavedCitations(),
  ]);
  return settingsRaw !== null || citations.length > 0;
}

export async function clearGuestData(): Promise<void> {
  await AsyncStorage.multiRemove([
    GUEST_MODE_KEY,
    GUEST_WIDGET_SETTINGS_KEY,
    GUEST_SAVED_CITATIONS_KEY,
    WIDGET_CITATION_CACHE_KEY,
  ]);
}
