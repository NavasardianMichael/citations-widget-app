import type { WidgetDesignId } from "@/constants/widget-designs";
import type { CitationCategory } from "@/types/citation";

/** Flat, JSON-safe props pushed to home-screen widgets. */
export type HomeWidgetSnapshot = {
  quoteText: string;
  sourceText: string;
  /** Full plain attribution line (name only; never embeds the social URL). */
  attributionText: string | null;
  attributionBefore: string;
  attributionName: string | null;
  attributionAfter: string;
  /** When set, `attributionName` is a tappable/underlined link to this URL. */
  attributionUrl: string | null;
  showActions: boolean;
  /** Current citation id for in-widget save/unsave; null when empty. */
  citationId: string | null;
  citationText: string;
  citationSource: string;
  citationCategory: CitationCategory | null;
  /** Whether the current citation is in the user's saved list. */
  isSaved: boolean;
  designId: WidgetDesignId;
  /** Sanctuary random-pool index; ignored for fixed/solid designs. */
  backgroundImageIndex: number;
  fontFamily: string;
  /** Android assets/fonts basename without extension. */
  androidFontFile: string;
  fontSize: number;
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
  /** Same copy as settings preview (`settings.previewLoading`). */
  loadingMessage: string;
  /** True while a widget refresh is in flight — show loadingMessage as quote. */
  isRefreshing: boolean;
  /** True while save/unsave is in flight — spinner on the save action only. */
  isSaving: boolean;
  fetchedAt: number;
};

export const HOME_WIDGET_SNAPSHOT_KEY = "citations_home_widget_snapshot";
/** Default Android provider name (4×4). */
export const ANDROID_WIDGET_NAME = "CitationWidget";
/** All Android size variants shown in the widget picker. */
export const ANDROID_WIDGET_NAMES = [
  "CitationWidgetCompact",
  "CitationWidget",
  "CitationWidgetLarge",
  "CitationWidgetFullscreen",
] as const;
export type AndroidWidgetName = (typeof ANDROID_WIDGET_NAMES)[number];
export const IOS_WIDGET_NAME = "CitationWidget";

export function isAndroidWidgetName(name: string): name is AndroidWidgetName {
  return (ANDROID_WIDGET_NAMES as readonly string[]).includes(name);
}
