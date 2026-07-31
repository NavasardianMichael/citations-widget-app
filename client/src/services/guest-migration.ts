import {
  DEFAULT_FONT_STYLE,
  DEFAULT_QUOTE_FONT_SIZE,
  DEFAULT_SOURCE_SELECTION,
  FONT_STYLE_IDS,
  REFRESH_RATE_HOURS,
  SOURCE_SELECTION_IDS,
} from "@citations/shared";

import {
  DEFAULT_WIDGET_DESIGN,
  normalizeWidgetDesignId,
} from "@/constants/widget-designs";
import { fetchSavedCitations, getWidgetSettings, saveCitation, saveWidgetSettings } from "@/services/api";
import { clearGuestData, getGuestSavedCitations, getGuestWidgetSettings, hasGuestData } from "@/services/local-storage";
import type { WidgetSettingsDraft } from "@/types/citation";

/** Must match Prisma `WidgetSettings` column defaults for a brand-new account. */
const DEFAULT_ACCOUNT_SETTINGS: WidgetSettingsDraft = {
  sourceSelection: DEFAULT_SOURCE_SELECTION,
  refreshRateHours: 24,
  fontStyle: DEFAULT_FONT_STYLE,
  fontSize: DEFAULT_QUOTE_FONT_SIZE,
  widgetDesign: DEFAULT_WIDGET_DESIGN,
  showAttribution: true,
  showActions: true,
};

function sanitizeGuestSettings(draft: WidgetSettingsDraft): WidgetSettingsDraft {
  return {
    sourceSelection: (SOURCE_SELECTION_IDS as readonly string[]).includes(
      draft.sourceSelection,
    )
      ? draft.sourceSelection
      : DEFAULT_ACCOUNT_SETTINGS.sourceSelection,
    refreshRateHours: (REFRESH_RATE_HOURS as readonly number[]).includes(
      draft.refreshRateHours,
    )
      ? draft.refreshRateHours
      : DEFAULT_ACCOUNT_SETTINGS.refreshRateHours,
    fontStyle: (FONT_STYLE_IDS as readonly string[]).includes(draft.fontStyle)
      ? draft.fontStyle
      : DEFAULT_FONT_STYLE,
    fontSize: draft.fontSize,
    widgetDesign: normalizeWidgetDesignId(draft.widgetDesign),
    showAttribution: draft.showAttribution,
    showActions: draft.showActions,
  };
}

function isUnchanged(draft: WidgetSettingsDraft): boolean {
  // fontSize 16 = historical Prisma default; 20 = current shared default.
  const defaultFontSize =
    draft.fontSize === DEFAULT_QUOTE_FONT_SIZE || draft.fontSize === 16;
  return (
    draft.sourceSelection === DEFAULT_ACCOUNT_SETTINGS.sourceSelection &&
    draft.refreshRateHours === DEFAULT_ACCOUNT_SETTINGS.refreshRateHours &&
    draft.fontStyle === DEFAULT_ACCOUNT_SETTINGS.fontStyle &&
    defaultFontSize &&
    draft.widgetDesign === DEFAULT_ACCOUNT_SETTINGS.widgetDesign &&
    draft.showAttribution === DEFAULT_ACCOUNT_SETTINGS.showAttribution &&
    draft.showActions === DEFAULT_ACCOUNT_SETTINGS.showActions
  );
}

export async function migrateGuestDataToAccount(): Promise<void> {
  try {
    if (!(await hasGuestData())) return;

    const [accountSettings, accountSaved] = await Promise.all([getWidgetSettings(), fetchSavedCitations()]);
    const accountUnchanged = isUnchanged(accountSettings) && accountSaved.length === 0;

    if (accountUnchanged) {
      const guestSettings = sanitizeGuestSettings(await getGuestWidgetSettings());
      await saveWidgetSettings(guestSettings).catch(() => undefined);

      const guestSaved = await getGuestSavedCitations();
      for (const citation of guestSaved) {
        await saveCitation(citation.id).catch(() => undefined);
      }
    }
  } finally {
    await clearGuestData();
  }
}
