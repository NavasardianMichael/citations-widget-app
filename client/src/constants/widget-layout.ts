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
