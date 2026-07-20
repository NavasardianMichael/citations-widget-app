/**
 * Shared layout/typography for settings live preview and home-screen widgets.
 * Keep these in sync so the real widget matches what users see in Settings.
 */
export const WIDGET_LAYOUT = {
  /** Preview `p-8` / rounded-lg */
  padding: 32,
  borderRadius: 8,
  /** Design-system `text-body-md` */
  quoteFontSize: 16,
  quoteLineHeight: 24,
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
  /** Preview action circles `h-8 w-8` */
  actionSize: 32,
  actionIconSize: 18,
  actionGap: 8,
  /** Preview ornament / large quotes */
  ornamentIconSize: 20,
  largeQuoteFontSize: 48,
  ornamentInset: 8,
} as const;

export type WidgetLayout = typeof WIDGET_LAYOUT;

/**
 * Native widgets can't render `@expo/vector-icons/MaterialIcons` directly, so this
 * bundles the same MaterialIcons glyphs (registered via the `react-native-android-widget`
 * config plugin's `fonts` list) and uses their codepoints directly, keeping the
 * home-screen widget's icons pixel-identical to the Settings preview.
 *
 * `assets/fonts/material-icons/MaterialIcons.ttf` is NOT the full ~357KB upstream font —
 * it is subset down to only the glyphs in `WIDGET_ICON_GLYPH` (~1.6KB) using `subset-font`
 * (https://www.npmjs.com/package/subset-font). If you add a new icon below, regenerate it:
 *
 *   npm install --no-save subset-font
 *   node -e "
 *     const subsetFont = require('subset-font');
 *     const fs = require('fs');
 *     const src = fs.readFileSync('node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf');
 *     // Keep this codepoint list in sync with WIDGET_ICON_GLYPH below.
 *     const text = [0xe5d5, 0xe8b8, 0xe866, 0xe80d, 0xe3e4].map(cp => String.fromCodePoint(cp)).join('');
 *     subsetFont(src, text, { targetFormat: 'sfnt' }).then(buf => fs.writeFileSync('assets/fonts/material-icons/MaterialIcons.ttf', buf));
 *   "
 */
export const WIDGET_ICON_FONT_FAMILY = "MaterialIcons";

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
