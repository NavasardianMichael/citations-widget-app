import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { DEFAULT_WIDGET_DESIGN } from "@/constants/widget-designs";
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

async function loadSnapshot(): Promise<HomeWidgetSnapshot> {
  const raw = await AsyncStorage.getItem(HOME_WIDGET_SNAPSHOT_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as HomeWidgetSnapshot;
    } catch {
      // fall through
    }
  }

  const guest = await isGuestMode();
  const settings = guest ? await getGuestWidgetSettings() : await getWidgetSettings();
  const cached = await getCachedWidgetCitation();
  return buildHomeWidgetSnapshot(settings, cached?.citation ?? null);
}

async function refreshCitationSnapshot(): Promise<HomeWidgetSnapshot> {
  const guest = await isGuestMode();
  const settings = guest ? await getGuestWidgetSettings() : await getWidgetSettings();
  try {
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

  let snapshot = await loadSnapshot();

  if (props.widgetAction === "WIDGET_CLICK" && props.clickAction === "REFRESH") {
    snapshot = await refreshCitationSnapshot();
  }

  // Ensure defaults if older snapshots lack fields.
  snapshot = {
    ...buildHomeWidgetSnapshot(
      {
        sourceSelection: "mixed",
        refreshRateHours: 24,
        fontStyle: DEFAULT_WIDGET_FONT,
        widgetDesign: DEFAULT_WIDGET_DESIGN,
        showAttribution: true,
        showActions: true,
      },
      null,
    ),
    ...snapshot,
  };

  props.renderWidget(
    <CitationAndroidWidget
      snapshot={snapshot}
      width={props.widgetInfo.width}
      height={props.widgetInfo.height}
    />,
  );
}
