import { DEFAULT_FONT_STYLE, type FontStyleId } from '@citations/shared'
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
 * `label` uses the Armenian name from the font page.
 *
 * `family` is the alias this app registers with `expo-font`; `postScriptName` is
 * the name baked into the font file (name ID 6). The iOS widget extension needs
 * the latter — it loads the face through Core Text, not `expo-font`, so the
 * app's alias means nothing there. Run `node ./scripts/print-font-names.js`
 * after adding a font to read its real name instead of guessing.
 *
 * `hasGuillemets` records whether the face can draw « and » (U+00AB / U+00BB).
 * Several of these ship a cmap holding the Armenian block and almost nothing
 * else, and a face loaded from an asset gets no system fallback, so on those the
 * brackets came out as blank gaps around the quote. Verify with
 * `node ./scripts/check-font-glyphs.js` after adding or replacing a font.
 */
export const WIDGET_FONT_OPTIONS = [
  {
    id: 'vrdznagir',
    hasGuillemets: true,
    label: 'Վրձնագիր',
    family: 'Vrdznagir',
    postScriptName: 'Vrdznagir',
    source: require('../../assets/fonts/vrdznagir/Vrdznagir.otf'),
  },
  {
    id: 'braind_amanor',
    hasGuillemets: true,
    label: 'Բրեինդ Ամանոր',
    family: 'BraindAmanor',
    postScriptName: 'BraindAmanorRegular',
    source: require('../../assets/fonts/braind-amanor/BraindAmanor.otf'),
  },
  {
    id: 'artsakh',
    hasGuillemets: false,
    label: 'Արցախ',
    family: 'Artsakh',
    postScriptName: 'ArtsakhFontRegular',
    source: require('../../assets/fonts/artsakh/Artsakh.otf'),
  },
  {
    id: 'davel_aghvor',
    hasGuillemets: true,
    label: 'Դավել Աղվոր',
    family: 'DavelAghvor',
    postScriptName: 'DavelAghvor',
    source: require('../../assets/fonts/davel-aghvor/davel-aghvor.otf'),
  },
  {
    id: 'mardoto',
    hasGuillemets: true,
    label: 'Մարդոտո',
    family: 'Mardoto',
    postScriptName: 'Mardoto-Regular',
    source: require('../../assets/fonts/mardoto/Mardoto-Regular.ttf'),
  },
  {
    id: 'arti',
    hasGuillemets: true,
    label: 'Արդի',
    family: 'Arti',
    postScriptName: 'Artiv05-Regular',
    source: require('../../assets/fonts/arti/Arti-Regular.otf'),
  },
  {
    id: 'arian_grqi',
    hasGuillemets: true,
    label: 'Արիան Գրքի',
    family: 'ArianGrqi',
    postScriptName: 'ArianGrqi',
    source: require('../../assets/fonts/arian-grqi/Arian_Grqi_U.ttf'),
  },
  {
    id: 'braind_zbans',
    hasGuillemets: true,
    label: 'Բրեինդ Զբանս',
    family: 'BraindZbans',
    postScriptName: 'BraindIjevanRegular',
    source: require('../../assets/fonts/braind-zbans/BraindZbans.otf'),
  },
  {
    id: 'nortar_body',
    hasGuillemets: true,
    label: 'Նորտառ և Նորտառ Բոդի',
    family: 'NorTarBody',
    postScriptName: 'NorTarBody',
    source: require('../../assets/fonts/nortar-body/NorTarBody.otf'),
  },
  {
    id: 'arm_hmks_script',
    hasGuillemets: true,
    label: "Արմ Հմկ'ս Սքրիփթ",
    family: 'ArmHmksScript',
    postScriptName: "ArmHmk'sScript",
    source: require('../../assets/fonts/arm-hmks-script/ArmHmksScript.ttf'),
  },
  {
    id: 'noyemi',
    hasGuillemets: false,
    label: 'Նոյեմի',
    family: 'Noyemi',
    postScriptName: 'NoyemiRegular',
    source: require('../../assets/fonts/noyemi/Noyemi.otf'),
  },
  {
    id: 'armeniapedia_garun',
    hasGuillemets: false,
    label: 'Արմենիապեդիա Գարուն',
    family: 'ArmeniapediaGarun',
    postScriptName: 'ArmeniapediaGarun',
    source: require('../../assets/fonts/armeniapedia-garun/ArmeniapediaGarun.ttf'),
  },
  {
    id: 'armeniapedia_geghagrutyun',
    hasGuillemets: false,
    label: 'Արմենիապեդիա Գեղագրություն',
    family: 'ArmeniapediaGeghagrutyun',
    postScriptName: 'ArmeniapediaGeghagrutyun',
    source: require('../../assets/fonts/armeniapedia-geghagrutyun/ArmeniapediaGeghagrutyun.ttf'),
  },
  {
    id: 'sasuntsi',
    hasGuillemets: true,
    label: 'Սասունցի',
    family: 'Sasuntsi',
    postScriptName: 'Sasuntsi-Regular',
    source: require('../../assets/fonts/sasuntsi/Sasuntsi-Regular.ttf'),
  },
  {
    id: 'armeniapedia_jhapaven',
    hasGuillemets: false,
    label: 'Արմենիապեդիա Ժապավեն',
    family: 'ArmeniapediaJhapaven',
    postScriptName: 'ArmeniapediaJhapaven',
    source: require('../../assets/fonts/armeniapedia-jhapaven/ArmeniapediaJhapaven.ttf'),
  },
] as const

export type WidgetFontId = (typeof WIDGET_FONT_OPTIONS)[number]['id']

/** Compile-time guard: client font assets stay aligned with `@citations/shared`. */
type AssertFontIdsMatch = WidgetFontId extends FontStyleId
  ? FontStyleId extends WidgetFontId
    ? true
    : never
  : never
const _assertFontIdsMatch: AssertFontIdsMatch = true
void _assertFontIdsMatch

export const DEFAULT_WIDGET_FONT: WidgetFontId = DEFAULT_FONT_STYLE

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

/** Prefetch every widget face (e.g. settings font picker labels). */
export function ensureAllWidgetFontsLoaded(): Promise<void> {
  return Promise.all(WIDGET_FONT_IDS.map((id) => ensureWidgetFontLoaded(id))).then(
    () => undefined,
  )
}

export function getWidgetFontFamily(id: WidgetFontId): string {
  return byId[id].family
}

/** Core Text name for the iOS widget extension (see `WIDGET_FONT_OPTIONS`). */
export function getWidgetFontPostScriptName(id: WidgetFontId): string {
  return byId[id].postScriptName
}

/** Asset module for the iOS widget extension's App Group copy. */
export function getWidgetFontSource(id: WidgetFontId): number {
  return byId[id].source as number
}

export function getWidgetFontLabel(id: WidgetFontId): string {
  return byId[id].label
}

/**
 * Wrap a citation in Armenian quotation marks, but only in a face that has them.
 * On the rest the brackets simply do not appear, which reads as a rendering
 * fault rather than a style — so those faces show the quote unbracketed.
 */
export function formatWidgetQuote(text: string, id: WidgetFontId): string {
  if (!text) return ''
  return byId[id].hasGuillemets ? `«${text}»` : text
}
