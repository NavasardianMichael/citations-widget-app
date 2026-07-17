import { fetchSavedCitations, getWidgetSettings, saveCitation, saveWidgetSettings } from "@/services/api";
import { clearGuestData, getGuestSavedCitations, getGuestWidgetSettings, hasGuestData } from "@/services/local-storage";
import type { WidgetSettingsDraft } from "@/types/citation";

const DEFAULT_ACCOUNT_SETTINGS: WidgetSettingsDraft = {
  sourceSelection: "mixed",
  refreshRateHours: 24,
  fontStyle: "mardoto",
  showAttribution: true,
  showActions: true,
};

function isUnchanged(draft: WidgetSettingsDraft): boolean {
  return (
    draft.sourceSelection === DEFAULT_ACCOUNT_SETTINGS.sourceSelection &&
    draft.refreshRateHours === DEFAULT_ACCOUNT_SETTINGS.refreshRateHours &&
    draft.fontStyle === DEFAULT_ACCOUNT_SETTINGS.fontStyle &&
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
      const guestSettings = await getGuestWidgetSettings();
      await saveWidgetSettings(guestSettings);

      const guestSaved = await getGuestSavedCitations();
      for (const citation of guestSaved) {
        await saveCitation(citation.id).catch(() => undefined);
      }
    }
  } finally {
    await clearGuestData();
  }
}
