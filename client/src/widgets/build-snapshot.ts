import {
  DEFAULT_WIDGET_DESIGN,
  getWidgetDesign,
} from "@/constants/widget-designs";
import { DEFAULT_QUOTE_FONT_SIZE } from "@/constants/widget-layout";
import {
  DEFAULT_WIDGET_FONT,
  getWidgetFontFamily,
  WIDGET_FONT_OPTIONS,
  type WidgetFontId,
} from "@/fonts/registry";
import { resolveAttributionParts, splitAddedByLabel } from "@/lib/attribution";
import { t } from "@/i18n";
import { fetchSavedCitations } from "@/services/api";
import {
  getGuestSavedCitations,
  isGuestMode,
} from "@/services/local-storage";
import type { WidgetCitation, WidgetSettingsDraft } from "@/types/citation";
import type { HomeWidgetSnapshot } from "@/widgets/types";

function fontFileBasename(id: WidgetFontId): string {
  const map: Record<WidgetFontId, string> = {
    vrdznagir: "Vrdznagir",
    braind_amanor: "BraindAmanor",
    artsakh: "Artsakh",
    davel_aghvor: "davel-aghvor",
    mardoto: "Mardoto-Regular",
    arti: "Arti-Regular",
    arian_grqi: "Arian_Grqi_U",
    braind_zbans: "BraindZbans",
    nortar_body: "NorTarBody",
    arm_hmks_script: "ArmHmksScript",
    noyemi: "Noyemi",
    armeniapedia_garun: "ArmeniapediaGarun",
    armeniapedia_geghagrutyun: "ArmeniapediaGeghagrutyun",
    sasuntsi: "Sasuntsi-Regular",
    armeniapedia_jhapaven: "ArmeniapediaJhapaven",
  };
  return map[id];
}

const FONT_FILE_BY_ID = Object.fromEntries(
  WIDGET_FONT_OPTIONS.map((font) => [font.id, fontFileBasename(font.id)]),
) as Record<WidgetFontId, string>;

export async function resolveCitationIsSaved(
  citationId: string | null | undefined,
): Promise<boolean> {
  if (!citationId) return false;
  try {
    if (await isGuestMode()) {
      const saved = await getGuestSavedCitations();
      return saved.some((c) => c.id === citationId);
    }
    const saved = await fetchSavedCitations();
    return saved.some((c) => c?.id === citationId);
  } catch {
    // Missing/deleted citation or network blip must never break widget render.
    return false;
  }
}

export function buildHomeWidgetSnapshot(
  settings: WidgetSettingsDraft,
  citation: WidgetCitation | null,
  isSaved = false,
): HomeWidgetSnapshot {
  const design = getWidgetDesign(settings.widgetDesign ?? DEFAULT_WIDGET_DESIGN);
  const fontId = (settings.fontStyle ?? DEFAULT_WIDGET_FONT) as WidgetFontId;
  const resolved = settings.showAttribution
    ? resolveAttributionParts(citation?.addedBy, citation?.addedByUrl)
    : { name: null, url: null };
  const name = resolved.name;
  const attribution = name ? splitAddedByLabel(name) : null;
  const attributionUrl = name ? resolved.url : null;

  return {
    quoteText: citation?.text ? `«${citation.text}»` : "",
    sourceText: citation?.source ?? "",
    attributionText: attribution?.full ?? null,
    attributionBefore: attribution?.before ?? "",
    attributionName: name,
    attributionAfter: attribution?.after ?? "",
    attributionUrl,
    showActions: settings.showActions,
    citationId: citation?.id ?? null,
    citationText: citation?.text ?? "",
    citationSource: citation?.source ?? "",
    citationCategory: citation?.category ?? null,
    isSaved: Boolean(citation && isSaved),
    designId: design.id,
    backgroundImageIndex: citation?.backgroundImageIndex ?? 0,
    fontFamily: getWidgetFontFamily(fontId),
    androidFontFile: FONT_FILE_BY_ID[fontId] ?? FONT_FILE_BY_ID[DEFAULT_WIDGET_FONT],
    fontSize: settings.fontSize ?? DEFAULT_QUOTE_FONT_SIZE,
    panelBg: design.panelBg,
    panelBorderColor: design.panelBorderColor,
    accentBorderColor: design.accentBorderColor,
    accentBorderWidth: design.accentBorderWidth,
    quoteColor: design.quoteColor,
    metaColor: design.metaColor,
    attributionColor: design.attributionColor,
    actionBg: design.actionBg,
    actionIconColor: design.actionIconColor,
    ornamentColor: design.ornamentColor,
    ornamentOpacity: design.ornamentOpacity,
    showOrnament: design.showOrnament,
    showLargeQuotes: design.showLargeQuotes,
    overlayColor: design.overlayColor ?? null,
    hasBackgroundImage: Boolean(design.randomBackground),
    emptyMessage: t("settings.previewEmpty"),
    loadingMessage: t("settings.previewLoading"),
    isRefreshing: false,
    isSaving: false,
    quotePageIndex: 0,
    fetchedAt: Date.now(),
  };
}

export async function buildHomeWidgetSnapshotAsync(
  settings: WidgetSettingsDraft,
  citation: WidgetCitation | null,
): Promise<HomeWidgetSnapshot> {
  const isSaved = await resolveCitationIsSaved(citation?.id);
  return buildHomeWidgetSnapshot(settings, citation, isSaved);
}
