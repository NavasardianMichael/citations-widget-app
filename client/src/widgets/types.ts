import type { WidgetDesignId } from "@/constants/widget-designs";

/** Flat, JSON-safe props pushed to home-screen widgets. */
export type HomeWidgetSnapshot = {
  quoteText: string;
  sourceText: string;
  attributionText: string | null;
  showActions: boolean;
  designId: WidgetDesignId;
  fontFamily: string;
  /** Android assets/fonts basename without extension. */
  androidFontFile: string;
  panelBg: string;
  panelBorderColor: string;
  accentBorderColor: string;
  accentBorderWidth: number;
  quoteColor: string;
  metaColor: string;
  attributionColor: string;
  actionBg: string;
  actionIconColor: string;
  ornamentColor: string;
  ornamentOpacity: number;
  showOrnament: boolean;
  showLargeQuotes: boolean;
  /** Dark scrim over photo backgrounds; null for solid designs. */
  overlayColor: string | null;
  hasBackgroundImage: boolean;
  emptyMessage: string;
  fetchedAt: number;
};

export const HOME_WIDGET_SNAPSHOT_KEY = "citations_home_widget_snapshot";
export const ANDROID_WIDGET_NAME = "CitationWidget";
export const IOS_WIDGET_NAME = "CitationWidget";
