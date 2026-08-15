/**
 * Predefined home-widget looks. Colors use rgba so they sit over
 * wallpaper / home screens with readable contrast.
 *
 * Solid styles + one photo style (`sanctuary`). Sanctuary is the only
 * photo design: each *new* citation fetch rolls a random background from
 * WIDGET_BACKGROUND_IMAGES. That pick is only for the current display window
 * (settings + home widget) — not permanently attached to a citation id.
 *
 * Design ids / pool size live in `@citations/shared` (also used by the API).
 */
import {
  DEFAULT_WIDGET_DESIGN,
  RANDOM_BACKGROUND_DESIGN,
  WIDGET_BACKGROUND_IMAGE_COUNT,
  WIDGET_DESIGN_IDS,
  type WidgetDesignId,
} from '@citations/shared'
import type { ImageSourcePropType } from 'react-native'

export {
  DEFAULT_WIDGET_DESIGN,
  RANDOM_BACKGROUND_DESIGN,
  WIDGET_DESIGN_IDS,
  type WidgetDesignId,
}

export type WidgetDesignLabelKey =
  | 'settings.designClassic'
  | 'settings.designParchment'
  | 'settings.designMidnight'
  | 'settings.designSanctuary'
  | 'settings.designNoir'
  | 'settings.designFrost'
  | 'settings.designTransparentDark'
  | 'settings.designTransparentLight'

export type WidgetDesignTokens = {
  id: WidgetDesignId
  labelKey: WidgetDesignLabelKey
  panelBg: string
  panelBorderColor: string
  accentBorderColor: string
  accentBorderWidth: number
  quoteColor: string
  metaColor: string
  attributionColor: string
  actionBg: string
  actionIconColor: string
  ornamentColor: string
  ornamentOpacity: number
  showOrnament: boolean
  showLargeQuotes: boolean
  shadow: string
  /** Scrim drawn over a photo so text stays readable. */
  overlayColor?: string
  /**
   * When true, pick from WIDGET_BACKGROUND_IMAGES on each new citation
   * (see RANDOM_BACKGROUND_DESIGN / sanctuary).
   */
  randomBackground?: boolean
  /**
   * In-app-only stand-in for `panelBg`, used solely by `WidgetPreview` (Settings
   * live preview + Citations library rows). The real home-screen widget always
   * renders `panelBg` (transparent, for these designs) — but the app's own pages
   * are white, so a transparent + white-text design needs a translucent backdrop
   * there or the text disappears. Falls back to `panelBg` when unset.
   */
  inAppPreviewBg?: string
}

/** Pool used only by the sanctuary (random) design. */
export const WIDGET_BACKGROUND_IMAGES: ImageSourcePropType[] = [
  require('../../assets/images/widget-bg/1.jpg'),
  require('../../assets/images/widget-bg/2.jpg'),
  require('../../assets/images/widget-bg/3.jpg'),
  require('../../assets/images/widget-bg/example-of-a-gavit-at-sanahin-monastery.jpg'),
  require('../../assets/images/widget-bg/a-khachkar-stone-at-geghard-monastery-in-northern-armenia.jpg'),
  require('../../assets/images/widget-bg/the-tiny-katoghike-church-in-yerevan.jpg'),
  require('../../assets/images/widget-bg/saint-gregory-the-illuminator-the-biggest-church-in-armenia.jpg'),
  require('../../assets/images/widget-bg/beautiful-stone-carvings-at-saint-sargis-cathedral-in-kond-yerevan.jpg'),
  require('../../assets/images/widget-bg/geghard-monastery-and-the-surrounding-cliffs.jpg'),
  require('../../assets/images/widget-bg/sanahin-monastery.jpg'),
  require('../../assets/images/widget-bg/etchmiadzin-cathedral-and-vagharshapat-city-viewed-from-above.jpg'),
  require('../../assets/images/widget-bg/saint-hripsime-church-in-vagharshapat.jpg'),
  require('../../assets/images/widget-bg/the-ruins-of-zvartnots-cathedral-outside-yerevan.jpg'),
  require('../../assets/images/widget-bg/tatev-monastery-viewed-from-the-wings-of-tatev-ropeway.jpg'),
  require('../../assets/images/widget-bg/noravank-my-favourite-monastery-in-armenia.jpg'),
  require('../../assets/images/widget-bg/yererouk.jpg'),
  require('../../assets/images/widget-bg/the-iconic-khor-virap-with-ararat-in-the-background.jpg'),
  require('../../assets/images/widget-bg/sevanavank.jpg'),
  require('../../assets/images/widget-bg/haghartsin-monastery-in-dilijan-national-park.jpg'),
  require('../../assets/images/widget-bg/cathedral-of-the-holy-mother-of-god-with-its-ruined-domes-on-display-in-the-gard.jpg'),
  require('../../assets/images/widget-bg/holy-saviour-s-church-and-the-spitak-earthquake-memorial-in-gyumri.jpg'),
  require('../../assets/images/widget-bg/marmashen-monastery-near-gyumri.jpg'),
  require('../../assets/images/widget-bg/saghmosavank-monastery-near-yerevan.jpg'),
  require('../../assets/images/widget-bg/frescoes-and-icons-inside-the-main-church-at-akhtala-monastery.jpg'),
  require('../../assets/images/widget-bg/kecharis-monastery-in-tsaghkadzor.jpg'),
]

if (WIDGET_BACKGROUND_IMAGES.length !== WIDGET_BACKGROUND_IMAGE_COUNT) {
  throw new Error(
    `WIDGET_BACKGROUND_IMAGES length (${WIDGET_BACKGROUND_IMAGES.length}) must match WIDGET_BACKGROUND_IMAGE_COUNT (${WIDGET_BACKGROUND_IMAGE_COUNT}) from @citations/shared`,
  )
}

const PHOTO_TEXT = {
  quoteColor: '#fbf9f8',
  metaColor: '#fed65b',
  attributionColor: 'rgba(251, 249, 248, 0.82)',
  actionBg: 'rgba(15, 18, 24, 0.55)',
  actionIconColor: '#fbf9f8',
  ornamentColor: '#fed65b',
  ornamentOpacity: 0.35,
  showOrnament: true,
  showLargeQuotes: false,
  panelBorderColor: 'rgba(255, 255, 255, 0.22)',
  accentBorderColor: 'rgba(254, 214, 91, 0.65)',
  accentBorderWidth: 2,
  shadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
} as const

export const WIDGET_DESIGNS: Record<WidgetDesignId, WidgetDesignTokens> = {
  classic: {
    id: 'classic',
    labelKey: 'settings.designClassic',
    panelBg: 'rgba(255, 255, 255, 0.96)',
    panelBorderColor: 'rgba(196, 198, 206, 0.45)',
    accentBorderColor: '#735c00',
    accentBorderWidth: 2,
    quoteColor: '#1b1c1c',
    metaColor: '#021a35',
    attributionColor: '#44474d',
    actionBg: 'rgba(239, 237, 237, 0.92)',
    actionIconColor: '#44474d',
    ornamentColor: '#735c00',
    ornamentOpacity: 0.2,
    showOrnament: true,
    showLargeQuotes: false,
    shadow: '0 4px 20px rgba(2, 26, 53, 0.15)',
  },
  parchment: {
    id: 'parchment',
    labelKey: 'settings.designParchment',
    panelBg: 'rgba(236, 214, 160, 0.96)',
    panelBorderColor: 'rgba(176, 142, 74, 0.45)',
    accentBorderColor: '#b08e4a',
    accentBorderWidth: 3,
    quoteColor: '#3a2a12',
    metaColor: '#6b4f1d',
    attributionColor: '#8a6a2e',
    actionBg: 'rgba(210, 180, 110, 0.45)',
    actionIconColor: '#5c4018',
    ornamentColor: '#8a6a2e',
    ornamentOpacity: 0.2,
    showOrnament: true,
    showLargeQuotes: false,
    shadow: '0 6px 18px rgba(115, 92, 0, 0.16)',
  },
  midnight: {
    id: 'midnight',
    labelKey: 'settings.designMidnight',
    panelBg: 'rgba(2, 26, 53, 0.82)',
    panelBorderColor: 'rgba(179, 200, 235, 0.25)',
    accentBorderColor: '#fed65b',
    accentBorderWidth: 2,
    quoteColor: '#fbf9f8',
    metaColor: '#fed65b',
    attributionColor: 'rgba(212, 227, 255, 0.75)',
    actionBg: 'rgba(26, 47, 75, 0.85)',
    actionIconColor: '#d4e3ff',
    ornamentColor: '#fed65b',
    ornamentOpacity: 0.25,
    showOrnament: true,
    showLargeQuotes: false,
    shadow: '0 8px 24px rgba(2, 26, 53, 0.35)',
  },
  noir: {
    id: 'noir',
    labelKey: 'settings.designNoir',
    panelBg: 'rgba(8, 8, 8, 0.94)',
    panelBorderColor: 'rgba(255, 255, 255, 0.12)',
    accentBorderColor: '#d4af37',
    accentBorderWidth: 1,
    quoteColor: '#f5f5f5',
    metaColor: '#d4af37',
    attributionColor: 'rgba(200, 200, 200, 0.75)',
    actionBg: 'rgba(28, 28, 28, 0.95)',
    actionIconColor: '#f0f0f0',
    ornamentColor: '#d4af37',
    ornamentOpacity: 0.2,
    showOrnament: false,
    showLargeQuotes: true,
    shadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
  },
  frost: {
    id: 'frost',
    labelKey: 'settings.designFrost',
    panelBg: 'rgba(236, 244, 252, 0.82)',
    panelBorderColor: 'rgba(148, 187, 233, 0.45)',
    accentBorderColor: '#6b9bd1',
    accentBorderWidth: 2,
    quoteColor: '#0f2744',
    metaColor: '#2f5f8f',
    attributionColor: 'rgba(47, 78, 112, 0.82)',
    actionBg: 'rgba(255, 255, 255, 0.55)',
    actionIconColor: '#1a3a5c',
    ornamentColor: '#6b9bd1',
    ornamentOpacity: 0.2,
    showOrnament: true,
    showLargeQuotes: false,
    shadow: '0 8px 24px rgba(47, 95, 143, 0.16)',
  },
  transparentDark: {
    id: 'transparentDark',
    labelKey: 'settings.designTransparentDark',
    // No panel on the real widget — white text sits directly on a dark wallpaper.
    panelBg: 'rgba(0, 0, 0, 0)',
    panelBorderColor: 'rgba(0, 0, 0, 0)',
    accentBorderColor: 'rgba(0, 0, 0, 0)',
    accentBorderWidth: 0,
    quoteColor: '#ffffff',
    metaColor: '#ffffff',
    attributionColor: '#ffffff',
    actionBg: 'rgba(0, 0, 0, 0.45)',
    actionIconColor: '#ffffff',
    ornamentColor: '#ffffff',
    ornamentOpacity: 0.3,
    showOrnament: false,
    showLargeQuotes: false,
    shadow: 'none',
    // White text is invisible on the app's own white pages — give the Settings
    // preview / Citations rows a solid gray backdrop. The real widget
    // still gets transparent `panelBg` above.
    inAppPreviewBg: '#333333',
  },
  transparentLight: {
    id: 'transparentLight',
    labelKey: 'settings.designTransparentLight',
    // No panel on the real widget — black text sits directly on a light wallpaper.
    panelBg: 'rgba(0, 0, 0, 0)',
    panelBorderColor: 'rgba(0, 0, 0, 0)',
    accentBorderColor: 'rgba(0, 0, 0, 0)',
    accentBorderWidth: 0,
    quoteColor: '#000000',
    metaColor: '#000000',
    attributionColor: '#000000',
    actionBg: 'rgba(255, 255, 255, 0.55)',
    actionIconColor: '#000000',
    ornamentColor: '#000000',
    ornamentOpacity: 0.18,
    showOrnament: false,
    showLargeQuotes: false,
    shadow: 'none',
  },
  sanctuary: {
    id: 'sanctuary',
    labelKey: 'settings.designSanctuary',
    panelBg: 'rgba(18, 14, 12, 0.92)',
    ...PHOTO_TEXT,
    showOrnament: true,
    randomBackground: true,
    overlayColor: 'rgba(12, 10, 8, 0.72)',
  },
}

/** Map retired design ids onto current ones. */
export function normalizeWidgetDesignId(value: unknown): WidgetDesignId {
  if (value === 'vista' || value === 'horizon' || value === 'sanctuary') {
    return 'sanctuary'
  }
  if (value === 'manuscript') {
    return 'parchment'
  }
  if (
    value === 'glass' ||
    value === 'ink' ||
    value === 'ember' ||
    value === 'lagoon' ||
    value === 'copper'
  ) {
    return DEFAULT_WIDGET_DESIGN
  }
  if (
    typeof value === 'string' &&
    (WIDGET_DESIGN_IDS as readonly string[]).includes(value)
  ) {
    return value as WidgetDesignId
  }
  return DEFAULT_WIDGET_DESIGN
}

export function getWidgetDesign(id: WidgetDesignId): WidgetDesignTokens {
  return WIDGET_DESIGNS[normalizeWidgetDesignId(id)]
}

export function isTransparentWidgetDesign(id: WidgetDesignId): boolean {
  const normalized = normalizeWidgetDesignId(id)
  return normalized === 'transparentDark' || normalized === 'transparentLight'
}

/** Transparent designs never show the top-right flare, even if a snapshot still has it on. */
export function designShowsOrnament(id: WidgetDesignId): boolean {
  if (isTransparentWidgetDesign(id)) return false
  return getWidgetDesign(id).showOrnament
}

export function isWidgetDesignId(value: unknown): value is WidgetDesignId {
  return (
    typeof value === 'string' &&
    (WIDGET_DESIGN_IDS as readonly string[]).includes(value)
  )
}

export function designUsesRandomBackground(id: WidgetDesignId): boolean {
  return Boolean(getWidgetDesign(id).randomBackground)
}

export function designHasPhotoBackground(id: WidgetDesignId): boolean {
  return designUsesRandomBackground(id)
}

export function shiftWidgetDesign(
  id: WidgetDesignId,
  delta: number,
): WidgetDesignId {
  const index = WIDGET_DESIGN_IDS.indexOf(normalizeWidgetDesignId(id))
  const next =
    (index + delta + WIDGET_DESIGN_IDS.length) % WIDGET_DESIGN_IDS.length
  return WIDGET_DESIGN_IDS[next]
}

/** Roll a new random background image index — call once per freshly-fetched citation (sanctuary). */
export function pickBackgroundImageIndex(): number {
  return Math.floor(Math.random() * WIDGET_BACKGROUND_IMAGES.length)
}

export function normalizeBackgroundImageIndex(index: number): number {
  const count = WIDGET_BACKGROUND_IMAGES.length
  return ((index % count) + count) % count
}

export function getRandomPoolBackgroundImage(
  index: number,
): ImageSourcePropType {
  return WIDGET_BACKGROUND_IMAGES[normalizeBackgroundImageIndex(index)]
}

/** Resolve the photo for sanctuary (random pool). Solid designs return undefined. */
export function resolveWidgetBackgroundImage(
  designId: WidgetDesignId,
  randomIndex = 0,
): ImageSourcePropType | undefined {
  if (!designUsesRandomBackground(designId)) return undefined
  return getRandomPoolBackgroundImage(randomIndex)
}
