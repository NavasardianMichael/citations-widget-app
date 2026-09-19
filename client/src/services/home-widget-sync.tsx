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
import { toIosWidgetProps } from "@/widgets/ios-props";
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

    // The App Group file is what the extension actually reads; the prop push
    // alongside it stays for the in-app diagnostic and as a fallback path.
    const { writeIosSnapshotFile, relaxIosWidgetFileProtection } = await import(
      "@/widgets/ios-snapshot-file"
    );
    const { resolveIosBackgroundImageUri } = await import("@/widgets/ios-background");
    const { resolveIosWidgetFonts } = await import("@/widgets/ios-fonts");

    // The face names and the photo URI only exist once these copies land, so the
    // snapshot cannot carry them until they finish. Racing a timer keeps that
    // from deciding whether the widget gets written at all: this step copies
    // files into the App Group container and has stalled silently before, and a
    // pending promise never throws, so an unguarded await here simply never
    // reaches the write. Losing the styling is recoverable; losing the quote is
    // what puts the empty panel back on the home screen.
    const styling = await Promise.race([
      Promise.all([
        resolveIosBackgroundImageUri(snapshot.designId, snapshot.backgroundImageIndex),
        resolveIosWidgetFonts(fontId),
      ]).then(([backgroundImageUri, fonts]) => ({ backgroundImageUri, fonts })),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    mark(`ios: styling resolved=${styling !== null}`);

    // One write per sync. `File.write` replaces the file in place rather than
    // atomically, so every extra write is a window for the extension to read a
    // half-written file — it did once, landing on a one-character read.
    const payload: HomeWidgetSnapshot = styling
      ? {
          ...snapshot,
          backgroundImageUri: styling.backgroundImageUri,
          iosFontFamily: styling.fonts.quote,
          iosGlyphFontFamily: styling.fonts.glyph,
        }
      : snapshot;
    const bytes = JSON.stringify(payload).length;
    mark(`ios: snapshot file written=${writeIosSnapshotFile(payload)} bytes=${bytes}`);
    // The container this process resolves, so it can be compared against the one
    // the extension reports on the widget. The app writing a full snapshot while
    // the extension reads a single byte means they are addressing different
    // containers, which no change to the writing side can fix.
    const { widgetsDirectory } = await import("expo-widgets");
    mark(`ios: widgetsDirectory=${widgetsDirectory ?? "null"}`);

    // Must run after the snapshot and the font/photo copies, not before: a file
    // keeps the protection class it was created with, so relaxing the directory
    // ahead of the writes left the extension unable to read any of them while
    // the device was locked — which is when it renders.
    mark(`ios: protection relaxed on ${relaxIosWidgetFileProtection()} entries`);
    CitationWidget.updateSnapshot(toIosWidgetProps(payload));

    // TEMP diagnostic: reads the timeline back out of the App Group, so props that
    // are dropped in transit stay distinguishable from a push that never ran. Names
    // the surviving keys — a bare count is what hid the truncation for so long.
    const written = await CitationWidget.getTimeline();
    const stored = written[0]?.props ?? {};
    Sentry.captureMessage(
      `widget-sync: ios entries=${written.length} keys=[${Object.keys(stored).join(",")}] jsonChars=${
        typeof (stored as { json?: string }).json === "string"
          ? (stored as { json: string }).json.length
          : -1
      }`,
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
