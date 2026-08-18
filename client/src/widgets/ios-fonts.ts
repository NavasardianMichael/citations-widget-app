import { Asset } from "expo-asset";
import { Directory, File } from "expo-file-system";
import { widgetsDirectory } from "expo-widgets";

import { WIDGET_ICON_IOS_FONT_FAMILY } from "@/constants/widget-layout";
import {
  getWidgetFontPostScriptName,
  getWidgetFontSource,
  type WidgetFontId,
} from "@/fonts/registry";

const GLYPH_FONT_SOURCE = require("../../assets/fonts/widget-glyphs/WidgetGlyphs.ttf");

/** Prefix for the selectable quote face, so stale copies can be pruned. */
const QUOTE_FONT_PREFIX = "widget-font-";
const GLYPH_FONT_BASENAME = "widget-glyphs";

export type IosWidgetFontFamilies = {
  /** Core Text name of the user's quote face, or null to fall back to the system font. */
  quote: string | null;
  /** Core Text name of the MaterialIcons subset, or null to fall back to text glyphs. */
  glyph: string | null;
};

const NO_FONTS: IosWidgetFontFamilies = { quote: null, glyph: null };

/**
 * Copies a bundled font into the App Group container and returns its filename.
 * `expo-font` registrations live in the app process only, so the widget
 * extension has to load the face itself from the one directory both processes
 * can read (see `withIosWidgetReleaseRedBox`'s Core Text registration).
 */
async function copyFontToAppGroup(
  directory: string,
  module: number,
  basename: string,
): Promise<string | null> {
  const asset = Asset.fromModule(module);
  const filename = `${basename}.${asset.type || "ttf"}`;
  const destination = new File(directory, filename);
  if (destination.exists) return filename;

  await asset.downloadAsync();
  if (!asset.localUri) return null;

  await new File(asset.localUri).copy(destination);
  return destination.exists ? filename : null;
}

/** Drops quote faces the user no longer has selected; the container is tiny. */
function pruneStaleQuoteFonts(directory: string, keep: string | null): void {
  try {
    for (const item of new Directory(directory).list()) {
      const filename = item.uri.split("/").pop() ?? "";
      if (filename.startsWith(QUOTE_FONT_PREFIX) && filename !== keep) {
        item.delete();
      }
    }
  } catch {
    // Pruning is housekeeping — never fail a widget sync over it.
  }
}

/**
 * Makes the user's quote face and the widget icon glyphs available to the iOS
 * widget extension, returning the Core Text names its layout should ask for.
 */
export async function resolveIosWidgetFonts(
  fontId: WidgetFontId,
): Promise<IosWidgetFontFamilies> {
  if (!widgetsDirectory) return NO_FONTS;

  try {
    const quoteFile = await copyFontToAppGroup(
      widgetsDirectory,
      getWidgetFontSource(fontId),
      `${QUOTE_FONT_PREFIX}${fontId}`,
    );
    const glyphFile = await copyFontToAppGroup(
      widgetsDirectory,
      GLYPH_FONT_SOURCE as number,
      GLYPH_FONT_BASENAME,
    );
    pruneStaleQuoteFonts(widgetsDirectory, quoteFile);

    return {
      quote: quoteFile ? getWidgetFontPostScriptName(fontId) : null,
      glyph: glyphFile ? WIDGET_ICON_IOS_FONT_FAMILY : null,
    };
  } catch {
    return NO_FONTS;
  }
}
