import * as Font from 'expo-font'

/** App UI faces — loaded eagerly at startup. */
export const APP_FONT = {
  regular: 'GHEAGrapalat-Regular',
  bold: 'GHEAGrapalat-Bold',
  italic: 'GHEAGrapalat-Italic',
  boldItalic: 'GHEAGrapalat-BoldItalic',
} as const

export const APP_FONT_SOURCES = {
  [APP_FONT.regular]: require('../../assets/fonts/ghea-grapalat/GHEAGrpalatReg.otf'),
  [APP_FONT.bold]: require('../../assets/fonts/ghea-grapalat/GHEAGpalatBld.otf'),
  [APP_FONT.italic]: require('../../assets/fonts/ghea-grapalat/GHEAGrapalatRit.otf'),
  [APP_FONT.boldItalic]: require('../../assets/fonts/ghea-grapalat/GHEAGrapalatBlit.otf'),
} as const

/**
 * Widget typography options (commercially free fonts from fonter.am).
 * `label` is the original name from the font page.
 */
export const WIDGET_FONT_OPTIONS = [
  {
    id: 'vrdznagir',
    label: 'Vrdznagir',
    family: 'Vrdznagir',
    source: require('../../assets/fonts/vrdznagir/Vrdznagir.otf'),
  },
  {
    id: 'braind_amanor',
    label: 'Braind Amanor',
    family: 'BraindAmanor',
    source: require('../../assets/fonts/braind-amanor/BraindAmanor.otf'),
  },
  {
    id: 'artsakh',
    label: 'Artsakh',
    family: 'Artsakh',
    source: require('../../assets/fonts/artsakh/Artsakh.otf'),
  },
  {
    id: 'davel_aghvor',
    label: 'Davel Aghvor',
    family: 'DavelAghvor',
    source: require('../../assets/fonts/davel-aghvor/davel-aghvor.otf'),
  },
  {
    id: 'mardoto',
    label: 'Mardoto',
    family: 'Mardoto',
    source: require('../../assets/fonts/mardoto/Mardoto-Regular.ttf'),
  },
  {
    id: 'arti',
    label: 'Arti',
    family: 'Arti',
    source: require('../../assets/fonts/arti/Arti-Regular.otf'),
  },
  {
    id: 'arian_grqi',
    label: 'Arian Grqi',
    family: 'ArianGrqi',
    source: require('../../assets/fonts/arian-grqi/Arian_Grqi_U.ttf'),
  },
  {
    id: 'braind_zbans',
    label: 'Braind Zbans',
    family: 'BraindZbans',
    source: require('../../assets/fonts/braind-zbans/BraindZbans.otf'),
  },
  {
    id: 'nortar_body',
    label: 'Nortar & Nortar Body',
    family: 'NorTarBody',
    source: require('../../assets/fonts/nortar-body/NorTarBody.otf'),
  },
  {
    id: 'arm_hmks_script',
    label: "Arm Hmk's Script",
    family: 'ArmHmksScript',
    source: require('../../assets/fonts/arm-hmks-script/ArmHmksScript.ttf'),
  },
  {
    id: 'noyemi',
    label: 'Noyemi',
    family: 'Noyemi',
    source: require('../../assets/fonts/noyemi/Noyemi.otf'),
  },
  {
    id: 'armeniapedia_garun',
    label: 'Armeniapedia Garun',
    family: 'ArmeniapediaGarun',
    source: require('../../assets/fonts/armeniapedia-garun/ArmeniapediaGarun.ttf'),
  },
  {
    id: 'armeniapedia_geghagrutyun',
    label: 'Armeniapedia Geghagrutyun',
    family: 'ArmeniapediaGeghagrutyun',
    source: require('../../assets/fonts/armeniapedia-geghagrutyun/ArmeniapediaGeghagrutyun.ttf'),
  },
  {
    id: 'sasuntsi',
    label: 'Sasuntsi',
    family: 'Sasuntsi',
    source: require('../../assets/fonts/sasuntsi/Sasuntsi-Regular.ttf'),
  },
  {
    id: 'armeniapedia_jhapaven',
    label: 'Armeniapedia Jhapaven',
    family: 'ArmeniapediaJhapaven',
    source: require('../../assets/fonts/armeniapedia-jhapaven/ArmeniapediaJhapaven.ttf'),
  },
] as const

export type WidgetFontId = (typeof WIDGET_FONT_OPTIONS)[number]['id']

export const DEFAULT_WIDGET_FONT: WidgetFontId = 'mardoto'

export const WIDGET_FONT_IDS = WIDGET_FONT_OPTIONS.map((f) => f.id) as [
  WidgetFontId,
  ...WidgetFontId[],
]

const byId = Object.fromEntries(WIDGET_FONT_OPTIONS.map((f) => [f.id, f])) as Record<
  WidgetFontId,
  (typeof WIDGET_FONT_OPTIONS)[number]
>

const loadPromises = new Map<WidgetFontId, Promise<void>>()

/** Lazy-load a widget font once; subsequent calls reuse the same promise. */
export function ensureWidgetFontLoaded(id: WidgetFontId): Promise<void> {
  const existing = loadPromises.get(id)
  if (existing) return existing

  const font = byId[id]
  const promise = Font.loadAsync({ [font.family]: font.source }).then(() => undefined)
  loadPromises.set(id, promise)
  return promise
}

export function getWidgetFontFamily(id: WidgetFontId): string {
  return byId[id].family
}

export function getWidgetFontLabel(id: WidgetFontId): string {
  return byId[id].label
}
