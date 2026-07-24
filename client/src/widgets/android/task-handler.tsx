import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { DEFAULT_QUOTE_FONT_SIZE } from "@/constants/widget-layout";
import { DEFAULT_WIDGET_FONT } from "@/fonts/registry";
import { fetchWidgetCitation } from "@/services/api";
import { pickGuestWidgetCitation } from "@/services/guest-citation-picker";
import {
  getCachedWidgetCitation,
  getGuestWidgetSettings,
  isGuestMode,
  setCachedWidgetCitation,
} from "@/services/local-storage";
import { getWidgetSettings } from "@/services/widget-settings";
import { buildHomeWidgetSnapshot } from "@/widgets/build-snapshot";
import { CitationAndroidWidget } from "@/widgets/android/CitationAndroidWidget";
import {
  ANDROID_WIDGET_NAME,
  HOME_WIDGET_SNAPSHOT_KEY,
  type HomeWidgetSnapshot,
} from "@/widgets/types";

const FALLBACK_SETTINGS = {
  sourceSelection: "mixed" as const,
  refreshRateHours: 24 as const,
  fontStyle: DEFAULT_WIDGET_FONT,
  fontSize: DEFAULT_QUOTE_FONT_SIZE,
  showAttribution: true,
  showActions: true,
};

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
    const guest = await isGuestMode();
    const settings = guest ? await getGuestWidgetSettings() : await getWidgetSettings();
    const cached = await getCachedWidgetCitation();
    return buildHomeWidgetSnapshot(settings, cached?.citation ?? null);
  } catch {
    // No persisted snapshot AND settings/cache unreachable (e.g. first placement with no
    // network yet) — render the empty state instead of leaving the widget host with nothing.
    return buildHomeWidgetSnapshot(FALLBACK_SETTINGS, null);
  }
}

async function refreshCitationSnapshot(): Promise<HomeWidgetSnapshot> {
  try {
    const guest = await isGuestMode();
    const settings = guest ? await getGuestWidgetSettings() : await getWidgetSettings();
    const result = guest
      ? await pickGuestWidgetCitation(settings.sourceSelection)
      : await fetchWidgetCitation(true);
    await setCachedWidgetCitation({
      citation: result.citation,
      fetchedAt: Date.now(),
      sourceSelection: settings.sourceSelection,
    });
    const snapshot = buildHomeWidgetSnapshot(settings, result.citation);
    await AsyncStorage.setItem(HOME_WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));
    return snapshot;
  } catch {
    return loadSnapshot();
  }
}

export async function citationWidgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== ANDROID_WIDGET_NAME) return;

  if (props.widgetAction === "WIDGET_DELETED") return;

  let snapshot: HomeWidgetSnapshot;
  try {
    snapshot = await loadSnapshot();

    if (props.widgetAction === "WIDGET_CLICK" && props.clickAction === "REFRESH") {
      snapshot = await refreshCitationSnapshot();
    }

    // Ensure defaults if older snapshots lack fields.
    snapshot = {
      ...buildHomeWidgetSnapshot(FALLBACK_SETTINGS, null),
      ...snapshot,
    };
  } catch {
    // Belt-and-suspenders: loadSnapshot/refreshCitationSnapshot already catch their own
    // failures, but renderWidget must run no matter what so the widget never goes blank.
    snapshot = buildHomeWidgetSnapshot(FALLBACK_SETTINGS, null);
  }

  props.renderWidget(
    <CitationAndroidWidget
      snapshot={snapshot}
      width={props.widgetInfo.width}
      height={props.widgetInfo.height}
    />,
  );
}
