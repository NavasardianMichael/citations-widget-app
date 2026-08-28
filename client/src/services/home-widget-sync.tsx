import { isWidgetRefreshDue, REFRESH_AT_MIDNIGHT } from "@citations/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { Sentry } from "@/lib/sentry";
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
import { withoutNullProps } from "@/widgets/ios-props";
import {
  ANDROID_WIDGET_NAMES,
  HOME_WIDGET_SNAPSHOT_KEY,
  type HomeWidgetSnapshot,
} from "@/widgets/types";

/**
 * The sync is a long `await` chain that reports nothing when it simply never
 * settles, which is how the iOS widget ended up holding a layout and no props.
 * These land on whatever error is eventually captured — including the stall
 * timeout in `_layout.tsx` — so the last step reached names the culprit.
 */
function mark(step: string): void {
  Sentry.addBreadcrumb({ category: "widget-sync", message: step, level: "info" });
}

/**
 * Rotates the cached citation once its refresh window has passed, mirroring what
 * the Settings preview does on mount.
 *
 * Neither widget host rotates quotes by itself: WidgetKit can't run our JS at
 * all, and Android's `WIDGET_UPDATE` deliberately skips fetching when a quote is
 * already cached (see `task-handler.tsx`). Without this, the same citation stays
 * on the home screen until the user opens Settings or taps refresh. Launch is
 * the natural rotation point. Interval rates leave the decision to the server;
 * midnight forces after the local date changes so UTC offset cannot skip a day.
 * Relaunching the app repeatedly the same day doesn't burn through citations.
 *
 * Returns null when the cache is still warm or the fetch fails — the caller then
 * keeps showing the cached quote rather than blanking the widget while offline.
 */
async function rotateStaleWidgetCitation(
  settings: WidgetSettingsDraft,
  cached: CachedWidgetCitation | null,
  guest: boolean,
): Promise<WidgetCitation | null> {
  const isWarm =
    Boolean(cached?.citation) &&
    cached?.sourceSelection === settings.sourceSelection &&
    !isWidgetRefreshDue(cached?.fetchedAt ?? 0, settings.refreshRateHours);
  if (isWarm) return null;

  try {
    // A signed-out (but non-guest) user has no token to fetch with, so use the
    // local pool instead of provoking a 401 on every launch.
    const useLocalPool = guest || !(await getAccessToken());
    // Midnight uses the device calendar day; force so the server rotates even
    // when its UTC day has not changed yet.
    const forceMidnight =
      !useLocalPool &&
      settings.refreshRateHours === REFRESH_AT_MIDNIGHT &&
      Boolean(cached?.citation);
    const result = useLocalPool
      ? await pickGuestWidgetCitation(settings.sourceSelection, settings.widgetDesign)
      : await fetchWidgetCitation(forceMidnight);
    await setCachedWidgetCitation({
      citation: result.citation,
      fetchedAt: Date.now(),
      sourceSelection: settings.sourceSelection,
    });
    return result.citation;
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
}

/** Push the last saved settings + cached citation to the home-screen widget. */
export async function syncHomeWidgetFromStoredState(): Promise<void> {
  if (Platform.OS === "web") return;
  mark("start");
  const guest = await isGuestMode();
  mark(`mode resolved (guest=${guest})`);
  const settings = guest
    ? await getGuestWidgetSettings()
    : await getWidgetSettings().catch(() => getGuestWidgetSettings());
  mark("settings loaded");
  const cached = await getCachedWidgetCitation();
  mark("cache read");
  const rotated = await rotateStaleWidgetCitation(settings, cached, guest);
  mark("rotation resolved");
  await syncHomeWidget(settings, rotated ?? cached?.citation ?? null);
  mark("sync complete");
}

export async function syncHomeWidget(
  settings: WidgetSettingsDraft,
  citation: WidgetCitation | null,
): Promise<void> {
  if (Platform.OS === "web") return;

  const snapshot = await buildHomeWidgetSnapshotAsync(settings, citation);
  mark("snapshot built");
  await AsyncStorage.setItem(HOME_WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));
  mark("snapshot stored");

  if (Platform.OS === "ios") {
    await pushIosWidget(snapshot, (settings.fontStyle ?? DEFAULT_WIDGET_FONT) as WidgetFontId);
  } else if (Platform.OS === "android") {
    await pushAndroidWidget(snapshot);
  }
}

async function pushIosWidget(snapshot: HomeWidgetSnapshot, fontId: WidgetFontId) {
  try {
    mark("ios: importing widget");
    const CitationWidget = (await import("@/widgets/CitationWidget")).default;
    mark("ios: widget imported");

    // Store the quote before resolving fonts/background: those copy files into the
    // App Group container, and anything that stalls or fails there must not cost the
    // widget its text — an unstyled citation beats WidgetKit's empty-props fallback.
    CitationWidget.updateSnapshot(withoutNullProps(snapshot));
    mark("ios: text-only props stored");

    const { resolveIosBackgroundImageUri } = await import("@/widgets/ios-background");
    const { resolveIosWidgetFonts } = await import("@/widgets/ios-fonts");
    const [backgroundImageUri, fonts] = await Promise.all([
      resolveIosBackgroundImageUri(snapshot.designId, snapshot.backgroundImageIndex),
      resolveIosWidgetFonts(fontId),
    ]);
    mark("ios: fonts and background resolved");
    CitationWidget.updateSnapshot(
      withoutNullProps({
        ...snapshot,
        backgroundImageUri,
        iosFontFamily: fonts.quote,
        iosGlyphFontFamily: fonts.glyph,
      }),
    );

    // TEMP diagnostic: reads the timeline back out of the App Group so a push that
    // "succeeds" but stores nothing is distinguishable from one that never ran.
    const written = await CitationWidget.getTimeline();
    Sentry.captureMessage(
      `widget-sync: ios timeline entries=${written.length} propKeys=${Object.keys(written[0]?.props ?? {}).length}`,
      "info",
    );
  } catch (error) {
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
