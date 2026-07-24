/**
 * Shared layout/typography for settings live preview and home-screen widgets.
 * Keep these in sync so the real widget matches what users see in Settings.
 */
export const WIDGET_LAYOUT = {
  /** Preview `p-8` / rounded-lg */
  padding: 32,
  borderRadius: 8,
  /** Matches the real widget's declared minHeight (widgetprovider_citationwidget.xml) so the
   *  Settings preview pins its action row to the bottom the same way the real widget does. */
  previewMinHeight: 180,
  /** Design-system `text-label-sm` */
  metaFontSize: 12,
  metaLineHeight: 16,
  metaLetterSpacing: 0.6,
  /** Tailwind `text-sm` */
  attributionFontSize: 14,
  attributionLineHeight: 20,
  /** Preview `gap-6` between quote and meta block */
  sectionGap: 24,
  /** Preview `gap-3` inside meta block */
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

/** Typography range for the "font size" control in Settings → Typography. */
export const FONT_SIZE_MIN = 13;
export const FONT_SIZE_MAX = 22;
export const DEFAULT_QUOTE_FONT_SIZE = 16;

/** Quote line-height scales with font size at the same 1.5 ratio as the previous fixed 16/24. */
export function getQuoteLineHeight(fontSize: number): number {
  return Math.round(fontSize * 1.5);
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
 *     const text = [0xe5d5, 0xe8b8, 0xe866, 0xe80d, 0xe3e4].map(cp => String.fromCodePoint(cp)).join('');
 *     subsetFont(src, text, { targetFormat: 'sfnt' }).then(buf => fs.writeFileSync('assets/fonts/widget-glyphs/WidgetGlyphs.ttf', buf));
 *   "
 */
export const WIDGET_ICON_FONT_FAMILY = "WidgetGlyphs";

/** MaterialIcons glyph codepoints for `refresh` / `settings` / `bookmark` / `share` / `flare`. */
export const WIDGET_ICON_GLYPH = {
  refresh: "",
  settings: "",
  bookmark: "",
  share: "",
  flare: "",
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
