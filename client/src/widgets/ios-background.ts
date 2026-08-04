import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { widgetsDirectory } from "expo-widgets";

import {
  designUsesRandomBackground,
  getRandomPoolBackgroundImage,
  normalizeBackgroundImageIndex,
  type WidgetDesignId,
} from "@/constants/widget-designs";

/**
 * The iOS widget extension runs in its own process/App Group sandbox and can't
 * reach the main app's JS asset cache, so the chosen sanctuary photo has to be
 * copied once into `expo-widgets`' shared `widgetsDirectory` — the only
 * directory both the app and the widget extension can read. Returns a
 * `file://` URI for `@expo/ui/swift-ui`'s `Image` `uiImage` prop, or `null`
 * for solid (non-photo) designs or if the copy fails for any reason.
 */
export async function resolveIosBackgroundImageUri(
  designId: WidgetDesignId,
  index: number,
): Promise<string | null> {
  if (!designUsesRandomBackground(designId) || !widgetsDirectory) return null;

  const safeIndex = normalizeBackgroundImageIndex(index);

  try {
    const destination = new File(widgetsDirectory, `sanctuary-${safeIndex}.jpg`);
    if (destination.exists) return destination.uri;

    const asset = Asset.fromModule(getRandomPoolBackgroundImage(safeIndex) as number);
    await asset.downloadAsync();
    const source = asset.localUri;
    if (!source) return null;

    await new File(source).copy(destination);
    return destination.exists ? destination.uri : null;
  } catch {
    return null;
  }
}
