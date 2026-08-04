export type WidgetActionId = "refresh" | "toggle-save" | "share";

/**
 * Runs inside the iOS widget's sandboxed JS evaluation (see `CitationWidget.ios.tsx`),
 * which has no DOM globals — no `URLSearchParams` — so the query string is built
 * by hand with plain ECMAScript only.
 */
export function buildWidgetActionUri(action: WidgetActionId): string {
  return `citationswidget://widget-action?action=${encodeURIComponent(action)}`;
}
