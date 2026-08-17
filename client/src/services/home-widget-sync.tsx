import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { getWidgetSettings } from "@/services/api";
import {
  getCachedWidgetCitation,
  getGuestWidgetSettings,
  isGuestMode,
} from "@/services/local-storage";
import type { WidgetCitation, WidgetSettingsDraft } from "@/types/citation";
import { CitationAndroidWidget } from "@/widgets/android/CitationAndroidWidget";
import { buildHomeWidgetSnapshotAsync } from "@/widgets/build-snapshot";
import {
  ANDROID_WIDGET_NAMES,
  HOME_WIDGET_SNAPSHOT_KEY,
  type HomeWidgetSnapshot,
} from "@/widgets/types";

/** Push the last saved settings + cached citation to the home-screen widget. */
export async function syncHomeWidgetFromStoredState(): Promise<void> {
  if (Platform.OS === "web") return;
  const local = await isGuestMode();
  const settings = local
    ? await getGuestWidgetSettings()
    : await getWidgetSettings().catch(() => getGuestWidgetSettings());
  const cached = await getCachedWidgetCitation();
  await syncHomeWidget(settings, cached?.citation ?? null);
}

export async function syncHomeWidget(
  settings: WidgetSettingsDraft,
  citation: WidgetCitation | null,
): Promise<void> {
  if (Platform.OS === "web") return;

  const snapshot = await buildHomeWidgetSnapshotAsync(settings, citation);
  await AsyncStorage.setItem(HOME_WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));

  if (Platform.OS === "ios") {
    await pushIosWidget(snapshot);
  } else if (Platform.OS === "android") {
    await pushAndroidWidget(snapshot);
  }
}

async function pushIosWidget(snapshot: HomeWidgetSnapshot) {
  try {
    const CitationWidget = (await import("@/widgets/CitationWidget")).default;
    const { resolveIosBackgroundImageUri } = await import("@/widgets/ios-background");
    const backgroundImageUri = await resolveIosBackgroundImageUri(
      snapshot.designId,
      snapshot.backgroundImageIndex,
    );
    CitationWidget.updateSnapshot({ ...snapshot, backgroundImageUri });
  } catch (error) {
    const { Sentry } = await import("@/lib/sentry");
    Sentry.captureException(error);
  }
}

async function pushAndroidWidget(snapshot: HomeWidgetSnapshot) {
  try {
    const { requestWidgetUpdate } = await import("react-native-android-widget");
    await Promise.all(
      ANDROID_WIDGET_NAMES.map((widgetName) =>
        requestWidgetUpdate({
          widgetName,
          renderWidget: (widgetInfo) => (
            <CitationAndroidWidget
              snapshot={snapshot}
              width={widgetInfo.width}
              height={widgetInfo.height}
            />
          ),
        }),
      ),
    );
  } catch {
    // No widget instances / native module not linked yet.
  }
}
