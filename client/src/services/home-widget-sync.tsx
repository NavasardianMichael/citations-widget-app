import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { DEFAULT_WIDGET_FONT, type WidgetFontId } from "@/fonts/registry";
import { fetchWidgetCitation, getWidgetSettings } from "@/services/api";
import { getAccessToken } from "@/services/auth-storage";
import { pickGuestWidgetCitation } from "@/services/guest-citation-picker";
import {
  getCachedWidgetCitation,
  getGuestWidgetSettings,
  isGuestMode,
  setCachedWidgetCitation,
  type CachedWidgetCitation,
} from "@/services/local-storage";
import type { WidgetCitation, WidgetSettingsDraft } from "@/types/citation";
import { CitationAndroidWidget } from "@/widgets/android/CitationAndroidWidget";
import { buildHomeWidgetSnapshotAsync } from "@/widgets/build-snapshot";
import {
  ANDROID_WIDGET_NAMES,
  HOME_WIDGET_SNAPSHOT_KEY,
  type HomeWidgetSnapshot,
} from "@/widgets/types";

/**
 * Rotates the cached citation once its refresh window has passed, mirroring what
 * the Settings preview does on mount.
 *
 * Neither widget host rotates quotes by itself: WidgetKit can't run our JS at
 * all, and Android's `WIDGET_UPDATE` deliberately skips fetching when a quote is
 * already cached (see `task-handler.tsx`). Without this, the same citation stays
 * on the home screen until the user opens Settings or taps refresh. Launch is
 * the natural rotation point, and `forceFresh: false` leaves the decision to the
 * server, so relaunching the app repeatedly doesn't burn through citations.
 *
 * Returns null when the cache is still warm or the fetch fails — the caller then
 * keeps showing the cached quote rather than blanking the widget while offline.
 */
async function rotateStaleWidgetCitation(
  settings: WidgetSettingsDraft,
  cached: CachedWidgetCitation | null,
  guest: boolean,
): Promise<WidgetCitation | null> {
  const rotationMs = settings.refreshRateHours * 60 * 60 * 1000;
  const isWarm =
    Boolean(cached?.citation) &&
    cached?.sourceSelection === settings.sourceSelection &&
    Date.now() - (cached?.fetchedAt ?? 0) < rotationMs;
  if (isWarm) return null;

  try {
    // A signed-out (but non-guest) user has no token to fetch with, so use the
    // local pool instead of provoking a 401 on every launch.
    const useLocalPool = guest || !(await getAccessToken());
    const result = useLocalPool
      ? await pickGuestWidgetCitation(settings.sourceSelection, settings.widgetDesign)
      : await fetchWidgetCitation(false);
    await setCachedWidgetCitation({
      citation: result.citation,
      fetchedAt: Date.now(),
      sourceSelection: settings.sourceSelection,
    });
    return result.citation;
  } catch {
    return null;
  }
}

/** Push the last saved settings + cached citation to the home-screen widget. */
export async function syncHomeWidgetFromStoredState(): Promise<void> {
  if (Platform.OS === "web") return;
  const guest = await isGuestMode();
  const settings = guest
    ? await getGuestWidgetSettings()
    : await getWidgetSettings().catch(() => getGuestWidgetSettings());
  const cached = await getCachedWidgetCitation();
  const rotated = await rotateStaleWidgetCitation(settings, cached, guest);
  await syncHomeWidget(settings, rotated ?? cached?.citation ?? null);
}

export async function syncHomeWidget(
  settings: WidgetSettingsDraft,
  citation: WidgetCitation | null,
): Promise<void> {
  if (Platform.OS === "web") return;

  const snapshot = await buildHomeWidgetSnapshotAsync(settings, citation);
  await AsyncStorage.setItem(HOME_WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));

  if (Platform.OS === "ios") {
    await pushIosWidget(snapshot, (settings.fontStyle ?? DEFAULT_WIDGET_FONT) as WidgetFontId);
  } else if (Platform.OS === "android") {
    await pushAndroidWidget(snapshot);
  }
}

/**
 * `expo-widgets` stores widget props in the App Group's `UserDefaults`, which
 * only accepts property-list types — and every JS `null` crosses into Swift as
 * `NSNull`. One null anywhere in the snapshot makes the insert raise, surfacing
 * as `Exception in HostFunction: <unknown>`, and the timeline is never written.
 * Dropping those keys is safe because `CitationWidget.ios.tsx` treats a missing
 * value and an empty one the same way.
 */
function withoutNullProps(snapshot: HomeWidgetSnapshot): HomeWidgetSnapshot {
  return Object.fromEntries(
    Object.entries(snapshot).filter(([, value]) => value !== null && value !== undefined),
  ) as HomeWidgetSnapshot;
}

async function pushIosWidget(snapshot: HomeWidgetSnapshot, fontId: WidgetFontId) {
  try {
    const CitationWidget = (await import("@/widgets/CitationWidget")).default;
    const { resolveIosBackgroundImageUri } = await import("@/widgets/ios-background");
    const { resolveIosWidgetFonts } = await import("@/widgets/ios-fonts");
    const [backgroundImageUri, fonts] = await Promise.all([
      resolveIosBackgroundImageUri(snapshot.designId, snapshot.backgroundImageIndex),
      resolveIosWidgetFonts(fontId),
    ]);
    CitationWidget.updateSnapshot(
      withoutNullProps({
        ...snapshot,
        backgroundImageUri,
        iosFontFamily: fonts.quote,
        iosGlyphFontFamily: fonts.glyph,
      }),
    );
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
