import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { DEFAULT_SOURCE_SELECTION } from "@citations/shared";

import { DEFAULT_WIDGET_DESIGN } from "@/constants/widget-designs";
import {
  DEFAULT_QUOTE_FONT_SIZE,
  WIDGET_LAYOUT,
} from "@/constants/widget-layout";
import { DEFAULT_WIDGET_FONT } from "@/fonts/registry";
import { t } from "@/i18n";
import { fetchWidgetCitation, saveCitation, unsaveCitation } from "@/services/api";
import { getAccessToken } from "@/services/auth-storage";
import { pickGuestWidgetCitation } from "@/services/guest-citation-picker";
import {
  getCachedWidgetCitation,
  getGuestWidgetSettings,
  isGuestMode,
  removeGuestSavedCitation,
  saveGuestSavedCitation,
  setCachedWidgetCitation,
} from "@/services/local-storage";
import { getWidgetSettings } from "@/services/widget-settings";
import {
  buildHomeWidgetSnapshot,
  buildHomeWidgetSnapshotAsync,
} from "@/widgets/build-snapshot";
import { CitationAndroidWidget } from "@/widgets/android/CitationAndroidWidget";
import {
  clampQuotePageIndex,
  computeQuotePages,
} from "@/widgets/android/quote-paging";
import {
  HOME_WIDGET_SNAPSHOT_KEY,
  isAndroidWidgetName,
  type HomeWidgetSnapshot,
} from "@/widgets/types";

const FALLBACK_SETTINGS = {
  sourceSelection: DEFAULT_SOURCE_SELECTION,
  refreshRateHours: 24 as const,
  fontStyle: DEFAULT_WIDGET_FONT,
  fontSize: DEFAULT_QUOTE_FONT_SIZE,
  widgetDesign: DEFAULT_WIDGET_DESIGN,
  showAttribution: true,
  showActions: true,
};

/** Guest mode, or not signed in yet (first widget add before Continue as guest / login). */
async function useLocalWidgetSettings(): Promise<boolean> {
  if (await isGuestMode()) return true;
  return !(await getAccessToken());
}

function withDefaults(snapshot: HomeWidgetSnapshot): HomeWidgetSnapshot {
  return {
    ...buildHomeWidgetSnapshot(FALLBACK_SETTINGS, null),
    ...snapshot,
    loadingMessage: snapshot.loadingMessage || t("settings.previewLoading"),
    quotePageIndex: snapshot.quotePageIndex ?? 0,
  };
}

function renderSnapshot(
  props: WidgetTaskHandlerProps,
  snapshot: HomeWidgetSnapshot,
) {
  props.renderWidget(
    <CitationAndroidWidget
      snapshot={withDefaults(snapshot)}
      width={props.widgetInfo.width}
      height={props.widgetInfo.height}
    />,
  );
}

/**
 * Loads (or rebuilds) the snapshot to render. This runs on EVERY widget task invocation,
 * including OS-triggered background updates with no user interaction — so a transient
 * network/auth failure here must never throw, or the widget host never gets a
 * `renderWidget` call at all and is left showing nothing.
 */
async function loadSnapshot(): Promise<HomeWidgetSnapshot> {
  const raw = await AsyncStorage.getItem(HOME_WIDGET_SNAPSHOT_KEY).catch(() => null);
  if (raw) {
    try {
      return JSON.parse(raw) as HomeWidgetSnapshot;
    } catch {
      // fall through to rebuilding from settings + cache
    }
  }

  try {
    const local = await useLocalWidgetSettings();
    const settings = local ? await getGuestWidgetSettings() : await getWidgetSettings();
    const cached = await getCachedWidgetCitation();
    return buildHomeWidgetSnapshotAsync(settings, cached?.citation ?? null);
  } catch {
    // No persisted snapshot AND settings/cache unreachable (e.g. first placement with no
    // network yet) — render the empty state instead of leaving the widget host with nothing.
    return buildHomeWidgetSnapshot(FALLBACK_SETTINGS, null);
  }
}

async function refreshCitationSnapshot(): Promise<HomeWidgetSnapshot> {
  try {
    const local = await useLocalWidgetSettings();
    const settings = local ? await getGuestWidgetSettings() : await getWidgetSettings();
    const result = local
      ? await pickGuestWidgetCitation(settings.sourceSelection, settings.widgetDesign)
      : await fetchWidgetCitation(true);
    await setCachedWidgetCitation({
      citation: result.citation,
      fetchedAt: Date.now(),
      sourceSelection: settings.sourceSelection,
    });
    const snapshot = await buildHomeWidgetSnapshotAsync(settings, result.citation);
    await AsyncStorage.setItem(HOME_WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));
    return snapshot;
  } catch {
    return loadSnapshot();
  }
}

function estimateActionRowCount(
  widgetWidth: number,
  showActions: boolean,
): number {
  if (!showActions) return 0;
  const actionCount = 3;
  const inner = Math.max(0, widgetWidth - WIDGET_LAYOUT.padding * 2);
  const cell = WIDGET_LAYOUT.actionSize + WIDGET_LAYOUT.actionGap;
  const perRow = Math.max(1, Math.floor((inner + WIDGET_LAYOUT.actionGap) / cell));
  return Math.ceil(actionCount / perRow);
}

/** Advance/rewind quote page and persist — no network. */
async function shiftQuotePage(
  snapshot: HomeWidgetSnapshot,
  delta: number,
  widgetWidth: number,
  widgetHeight: number,
): Promise<HomeWidgetSnapshot> {
  const quote = snapshot.quoteText || snapshot.emptyMessage;
  const paging = computeQuotePages({
    text: quote,
    widgetWidth,
    widgetHeight,
    fontSize: snapshot.fontSize,
    showOrnament: snapshot.showOrnament,
    showLargeQuotes: snapshot.showLargeQuotes,
    hasSource: Boolean(snapshot.sourceText),
    showActions: snapshot.showActions,
    actionRowCount: estimateActionRowCount(widgetWidth, snapshot.showActions),
    hasAttribution: Boolean(snapshot.attributionName),
  });
  const current = clampQuotePageIndex(
    snapshot.quotePageIndex ?? 0,
    paging.pageCount,
  );
  const nextIndex = clampQuotePageIndex(current + delta, paging.pageCount);
  if (nextIndex === current) return snapshot;

  const next: HomeWidgetSnapshot = {
    ...snapshot,
    quotePageIndex: nextIndex,
    isRefreshing: false,
    isSaving: false,
  };
  await AsyncStorage.setItem(HOME_WIDGET_SNAPSHOT_KEY, JSON.stringify(next));
  return next;
}

/** Save / unsave the current citation without opening the app. */
async function toggleSaveCitation(
  snapshot: HomeWidgetSnapshot,
): Promise<HomeWidgetSnapshot> {
  if (!snapshot.citationId || !snapshot.citationText || !snapshot.citationCategory) {
    return snapshot;
  }

  try {
    const guest = await isGuestMode();
    if (snapshot.isSaved) {
      if (guest) {
        await removeGuestSavedCitation(snapshot.citationId);
      } else {
        await unsaveCitation(snapshot.citationId);
      }
    } else if (guest) {
      await saveGuestSavedCitation({
        id: snapshot.citationId,
        text: snapshot.citationText,
        source: snapshot.citationSource,
        category: snapshot.citationCategory,
      });
    } else {
      await saveCitation(snapshot.citationId);
    }

    const next: HomeWidgetSnapshot = {
      ...snapshot,
      isSaved: !snapshot.isSaved,
      isRefreshing: false,
      isSaving: false,
      fetchedAt: Date.now(),
    };
    await AsyncStorage.setItem(HOME_WIDGET_SNAPSHOT_KEY, JSON.stringify(next));
    return next;
  } catch {
    return snapshot;
  }
}

export async function citationWidgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (!isAndroidWidgetName(props.widgetInfo.widgetName)) return;

  if (props.widgetAction === "WIDGET_DELETED") return;

  let snapshot: HomeWidgetSnapshot;
  try {
    snapshot = await loadSnapshot();

    // First placement (or any update before a citation has ever loaded) — nothing has
    // populated the cache yet, since that normally only happens via the Settings tab.
    // Fetch now instead of leaving the widget stuck on the empty-state message.
    if (
      !snapshot.citationText &&
      (props.widgetAction === "WIDGET_ADDED" || props.widgetAction === "WIDGET_UPDATE")
    ) {
      renderSnapshot(props, {
        ...snapshot,
        isRefreshing: true,
        isSaving: false,
        loadingMessage: snapshot.loadingMessage || t("settings.previewLoading"),
      });
      snapshot = await refreshCitationSnapshot();
    }

    if (props.widgetAction === "WIDGET_CLICK" && props.clickAction === "REFRESH") {
      // Paint loading copy + refresh-button spinner first, then fetch.
      renderSnapshot(props, {
        ...snapshot,
        isRefreshing: true,
        isSaving: false,
        loadingMessage: snapshot.loadingMessage || t("settings.previewLoading"),
      });
      snapshot = await refreshCitationSnapshot();
    }

    if (props.widgetAction === "WIDGET_CLICK" && props.clickAction === "TOGGLE_SAVE") {
      // Paint save-button spinner first, then toggle.
      renderSnapshot(props, {
        ...snapshot,
        isSaving: true,
        isRefreshing: false,
      });
      snapshot = await toggleSaveCitation(snapshot);
    }

    if (props.widgetAction === "WIDGET_CLICK" && props.clickAction === "PAGE_NEXT") {
      snapshot = await shiftQuotePage(
        snapshot,
        1,
        props.widgetInfo.width,
        props.widgetInfo.height,
      );
    }

    if (props.widgetAction === "WIDGET_CLICK" && props.clickAction === "PAGE_PREV") {
      snapshot = await shiftQuotePage(
        snapshot,
        -1,
        props.widgetInfo.width,
        props.widgetInfo.height,
      );
    }

    snapshot = withDefaults({
      ...snapshot,
      isRefreshing: false,
      isSaving: false,
    });
  } catch {
    // Belt-and-suspenders: loadSnapshot/refreshCitationSnapshot already catch their own
    // failures, but renderWidget must run no matter what so the widget never goes blank.
    snapshot = buildHomeWidgetSnapshot(FALLBACK_SETTINGS, null);
  }

  renderSnapshot(props, snapshot);
}
