/**
 * Shared layout/typography for:
 * - home-screen widgets
 * - Settings live preview
 * - Citations library items (same chrome, no actions)
 *
 * Quote and source share the user's Settings font size; only weight / case differ.
 */
import { Platform } from 'react-native'

export const WIDGET_LAYOUT = {
  /** Preview `p-6` / rounded-lg */
  padding: 24,
  borderRadius: 8,
  /** Matches the default 4×4 widget minHeight (widgetprovider_citationwidget.xml) so the
   *  Settings preview pins its action row to the bottom the same way the real widget does. */
  previewMinHeight: 250,
  /** Tailwind `text-sm` */
  attributionFontSize: 14,
  attributionLineHeight: 20,
  /** Gap between the quote/source block and bottom actions/attribution */
  sectionGap: 16,
  /**
   * Gap between citation quote and its source line.
   * Shared by: home widgets (Android/iOS), Settings live preview, Citations library cards.
   */
  quoteSourceGap: 16,
  /** Gap inside the bottom meta block (actions / attribution) */
  metaBlockGap: 12,
  /** Vertical space when source and actions wrap onto separate rows */
  sourceActionsGap: 16,
  /** Preview action circles — a little larger than the design-system default `h-8 w-8`. */
  actionSize: 40,
  actionIconSize: 22,
  actionGap: 10,
  /** Preview ornament / large quotes */
  ornamentIconSize: 20,
  largeQuoteFontSize: 48,
  ornamentInset: 8,
} as const;

export type WidgetLayout = typeof WIDGET_LAYOUT;

/** Re-export API contract sizes — single source in `@citations/shared`. */
export {
  DEFAULT_QUOTE_FONT_SIZE,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
} from '@citations/shared'

/** Quote line-height scales with font size; slightly roomy for Armenian glyphs. */
export function getQuoteLineHeight(fontSize: number): number {
  return Math.round(fontSize * 1.55);
}

/** Citation quote vs source weights — keep preview, saved cards, and widgets in sync. */
export const WIDGET_QUOTE_FONT_WEIGHT = '600' as const;
export const WIDGET_SOURCE_FONT_WEIGHT = 'normal' as const;
/** Submitter name in the attribution line (“added by …”). */
export const WIDGET_ATTRIBUTION_NAME_FONT_WEIGHT = '600' as const;

/**
 * In-app `Text` (Settings / library preview) weight styles.
 *
 * Home-screen Android `TextWidget` applies `fontWeight` via `Typeface.create(face, weight)`,
 * which emboldens a single-face OTF in place. React Native `Text` on Android does not: weights
 * 100–600 are ignored for custom fonts, and 700+ look for a missing `*_bold` file and can fall
 * back to a system face. So Android preview omits `fontWeight` and uses a horizontal text-shadow
 * to approximate the home widget; iOS/web can set weight normally.
 *
 * Do not dual-draw with an absolutely positioned `Text` — Android often ignores lineHeight on
 * absolute multiline text, which stacks glyphs on top of each other and paints over the source.
 */
export function widgetPreviewQuoteWeightStyle(): {
  fontWeight?: typeof WIDGET_QUOTE_FONT_WEIGHT
} {
  if (Platform.OS === 'android') return {}
  return { fontWeight: WIDGET_QUOTE_FONT_WEIGHT }
}

export function widgetPreviewSourceWeightStyle(): {
  fontWeight?: typeof WIDGET_SOURCE_FONT_WEIGHT
} {
  if (Platform.OS === 'android') return {}
  return { fontWeight: WIDGET_SOURCE_FONT_WEIGHT }
}

/** Whether the in-app preview should fake home-widget emboldening via text-shadow. */
export function widgetPreviewUsesFakeQuoteBold(): boolean {
  return Platform.OS === 'android'
}

/**
 * Native widgets can't render `@expo/vector-icons/MaterialIcons` directly, so this
 * bundles the same MaterialIcons glyphs as their own native font family (registered via the
 * `react-native-android-widget` config plugin's `fonts` list) and uses their codepoints
 * directly, keeping the home-screen widget's icons pixel-identical to the Settings preview.
 *
 * This MUST be named something other than "MaterialIcons": the config plugin copies it into
 * the app's native Android font assets at prebuild time, and a family-name collision with the
 * real (full, non-subsetted) `@expo/vector-icons/MaterialIcons` font that ships in that same
 * location will non-deterministically shadow one with the other — whichever copy step runs
 * last wins in a release build. That's why every JS-rendered MaterialIcons glyph *outside* the
 * widget (e.g. the Settings preview's action buttons) could silently vanish in a production
 * APK while looking fine in dev: dev mode resolves fonts through a different (Metro/JS) path
 * that isn't affected by the native asset collision.
 *
 * `assets/fonts/widget-glyphs/WidgetGlyphs.ttf` is NOT the full ~357KB upstream font — it is
 * subset down to only the glyphs in `WIDGET_ICON_GLYPH` (~1.6KB) using `subset-font`
 * (https://www.npmjs.com/package/subset-font). If you add a new icon below, regenerate it:
 *
 *   npm install --no-save subset-font
 *   node -e "
 *     const subsetFont = require('subset-font');
 *     const fs = require('fs');
 *     const src = fs.readFileSync('node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf');
 *     // Keep this codepoint list in sync with WIDGET_ICON_GLYPH below.
 *     const text = [0xe5d5, 0xe866, 0xe867, 0xe59a, 0xe80d, 0xe3e4, 0xe5ce, 0xe5cf].map(cp => String.fromCodePoint(cp)).join('');
 *     subsetFont(src, text, { targetFormat: 'sfnt' }).then(buf => fs.writeFileSync('assets/fonts/widget-glyphs/WidgetGlyphs.ttf', buf));
 *   "
 */
export const WIDGET_ICON_FONT_FAMILY = "WidgetGlyphs";

/** MaterialIcons glyph codepoints for widget action / ornament icons. */
export const WIDGET_ICON_GLYPH = {
  refresh: "",
  bookmark: "",
  bookmarkBorder: "",
  bookmarkRemove: "",
  share: "",
  flare: "",
  /** expand_less — quote page up */
  expandLess: "",
  /** expand_more — quote page down */
  expandMore: "",
} as const;

/** Apply alpha to `#RRGGBB` or `rgba(...)` for ornament colors. */
export function colorWithOpacity(color: string, opacity: number): string {
  const clamped = Math.min(1, Math.max(0, opacity));
  const rgba = color.match(
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/i,
  );
  if (rgba) {
    return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${clamped})`;
  }
  const hex = color.match(/^#([0-9a-fA-F]{6})$/);
  if (hex) {
    const n = Number.parseInt(hex[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${clamped})`;
  }
  return color;
}
