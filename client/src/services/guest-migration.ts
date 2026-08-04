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
  return (
    draft.sourceSelection === DEFAULT_ACCOUNT_SETTINGS.sourceSelection &&
    draft.refreshRateHours === DEFAULT_ACCOUNT_SETTINGS.refreshRateHours &&
    draft.fontStyle === DEFAULT_ACCOUNT_SETTINGS.fontStyle &&
    draft.fontSize === DEFAULT_ACCOUNT_SETTINGS.fontSize &&
    draft.widgetDesign === DEFAULT_ACCOUNT_SETTINGS.widgetDesign &&
    draft.showAttribution === DEFAULT_ACCOUNT_SETTINGS.showAttribution &&
    draft.showActions === DEFAULT_ACCOUNT_SETTINGS.showActions
  );
}

export type GuestMigrationCheck =
  /** Nothing on this device to migrate. */
  | { status: "none" }
  /** Guest data exists and the account is untouched — safe to copy over silently. */
  | { status: "auto" }
  /** Both sides have data — the user must pick which one to keep. */
  | { status: "conflict" };

export type GuestMigrationStrategy = "keep-local" | "use-remote";

/** Call right after sign-in, before touching guest data, to decide whether a user choice is needed. */
export async function checkGuestMigration(): Promise<GuestMigrationCheck> {
  if (!(await hasGuestData())) return { status: "none" };

  const [accountSettings, accountSaved] = await Promise.all([getWidgetSettings(), fetchSavedCitations()]);
  const accountUnchanged = isUnchanged(accountSettings) && accountSaved.length === 0;

  return accountUnchanged ? { status: "auto" } : { status: "conflict" };
}

/**
 * Applies the migration decision (the user's choice for a `conflict`, or the
 * only sensible option for `auto`) and always clears local guest data after —
 * whether we copied it into the account or the account's own data won out.
 */
export async function applyGuestMigration(strategy: GuestMigrationStrategy): Promise<void> {
  try {
    if (strategy === "keep-local") {
      const guestSettings = sanitizeGuestSettings(await getGuestWidgetSettings());
      await saveWidgetSettings(guestSettings).catch(() => undefined);

      const guestSaved = await getGuestSavedCitations();
      for (const citation of guestSaved) {
        await saveCitation(citation.id).catch(() => undefined);
      }
    }
    // "use-remote": the account's existing settings/saved citations are left as-is.
  } finally {
    await clearGuestData();
  }
}

/** Back-compat entry point for callers that don't need to handle a conflict prompt. */
export async function migrateGuestDataToAccount(): Promise<void> {
  const check = await checkGuestMigration();
  if (check.status === "none") return;
  await applyGuestMigration("keep-local");
}
