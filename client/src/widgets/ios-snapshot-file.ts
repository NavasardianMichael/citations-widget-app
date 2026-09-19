import { requireOptionalNativeModule } from "expo-modules-core";
import { File } from "expo-file-system";
import { widgetsDirectory } from "expo-widgets";

import { IOS_WIDGET_NAME, type HomeWidgetSnapshot } from "@/widgets/types";

/**
 * Strips iOS data protection from the App Group directory and everything in it,
 * added to the native module by `withIosWidgetReleaseRedBox`.
 *
 * A widget renders while the device is locked, and files written with the
 * default protection class are unreadable exactly then — the extension reported
 * the snapshot as absent on a fresh install while the app had just written 1601
 * bytes to it. A file does not reliably inherit its directory's class, so this
 * has to run *after* the writes, and it covers the copied Armenian faces and the
 * background photo in the same pass.
 *
 * Optional so a build without the patch, or any other platform, is a no-op
 * rather than a crash.
 */
const nativeWidgets = requireOptionalNativeModule<{
  relaxWidgetFileProtection?: () => number;
}>("ExpoWidgets");

/** Returns how many entries were relaxed, or -1 when unavailable. */
export function relaxIosWidgetFileProtection(): number {
  try {
    return nativeWidgets?.relaxWidgetFileProtection?.() ?? -1;
  } catch {
    return -1;
  }
}

/** Read by the widget extension; see `withIosWidgetReleaseRedBox`'s file reader. */
const SNAPSHOT_FILENAME = `${IOS_WIDGET_NAME}-snapshot.json`;

/**
 * Hands the snapshot to the widget extension through the App Group container.
 *
 * `UserDefaults` never delivered it: a ~40-key dictionary came back from the
 * app's own read with 3 keys left and reached the extension as no entry at all,
 * and mirroring it as a single string — the same call the layout crosses on —
 * did not arrive either. Files are the App Group's documented channel and the
 * one this app already depends on, since the Armenian faces are copied into
 * this very directory and loaded from it by the extension.
 *
 * Kept to `create`/`write`, the pair that has actually been seen working on a
 * device. A staged write renamed into place would be atomic and would remove the
 * extension's chance of reading a half-written file, but `moveSync` has never
 * run here — and an exception on this line costs the widget its content
 * entirely, which is not worth trading for. The extension discards anything that
 * is not whole JSON instead, which covers the same risk from the other side.
 *
 * `widgetsDirectory` is null when the native module is unavailable (Expo Go) or
 * the container cannot be resolved. Everything here is synchronous, so it cannot
 * stall the caller the way the earlier async push chain did.
 */
export function writeIosSnapshotFile(snapshot: HomeWidgetSnapshot): boolean {
  if (!widgetsDirectory) return false;

  const file = new File(widgetsDirectory, SNAPSHOT_FILENAME);
  if (!file.exists) {
    file.create({ intermediates: true });
  }
  file.write(JSON.stringify(snapshot));
  return true;
}
