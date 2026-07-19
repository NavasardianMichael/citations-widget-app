import {
  DEFAULT_WIDGET_DESIGN,
  getWidgetDesign,
} from "@/constants/widget-designs";
import {
  DEFAULT_WIDGET_FONT,
  getWidgetFontFamily,
  WIDGET_FONT_OPTIONS,
  type WidgetFontId,
} from "@/fonts/registry";
import { t } from "@/i18n";
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

export function buildHomeWidgetSnapshot(
  settings: WidgetSettingsDraft,
  citation: WidgetCitation | null,
): HomeWidgetSnapshot {
  const design = getWidgetDesign(settings.widgetDesign ?? DEFAULT_WIDGET_DESIGN);
  const fontId = (settings.fontStyle ?? DEFAULT_WIDGET_FONT) as WidgetFontId;
  const source =
    citation?.source ?? citation?.author ?? citation?.category ?? "";

  return {
    quoteText: citation?.text ? `"${citation.text}"` : "",
    sourceText: source,
    attributionText:
      settings.showAttribution && citation?.addedBy
        ? t("settings.addedBy", { name: citation.addedBy })
        : null,
    showActions: settings.showActions,
    designId: design.id,
    fontFamily: getWidgetFontFamily(fontId),
    androidFontFile: FONT_FILE_BY_ID[fontId] ?? FONT_FILE_BY_ID[DEFAULT_WIDGET_FONT],
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
    emptyMessage: t("settings.previewEmpty"),
    fetchedAt: Date.now(),
  };
}
