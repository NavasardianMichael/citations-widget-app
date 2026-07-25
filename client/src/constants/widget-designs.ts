/**
 * Predefined home-widget looks. Colors use rgba so they sit over
 * wallpaper / home screens with readable contrast.
 *
 * Six solid styles + one photo style (`sanctuary`). Sanctuary is the only
 * photo design: each *new* citation fetch rolls a random background from
 * WIDGET_BACKGROUND_IMAGES. That pick is only for the current display window
 * (settings + home widget) — not permanently attached to a citation id.
 *
 * Keep WIDGET_BACKGROUND_IMAGES' length in sync with the server's
 * WIDGET_BACKGROUND_IMAGE_COUNT (server/src/routes/widget.ts).
 */
import type { ImageSourcePropType } from 'react-native'

export const WIDGET_DESIGN_IDS = [
  'classic',
  'parchment',
  'midnight',
  'glass',
  'ink',
  'manuscript',
  'sanctuary',
] as const

export type WidgetDesignId = (typeof WIDGET_DESIGN_IDS)[number]

export const DEFAULT_WIDGET_DESIGN: WidgetDesignId = 'classic'

/** The sole photo design — rolls a fresh image from WIDGET_BACKGROUND_IMAGES per new citation. */
export const RANDOM_BACKGROUND_DESIGN: WidgetDesignId = 'sanctuary'

export type WidgetDesignLabelKey =
  | 'settings.designClassic'
  | 'settings.designParchment'
  | 'settings.designMidnight'
  | 'settings.designGlass'
  | 'settings.designInk'
  | 'settings.designManuscript'
  | 'settings.designSanctuary'

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
}

/** Pool used only by the sanctuary (random) design. */
export const WIDGET_BACKGROUND_IMAGES: ImageSourcePropType[] = [
  require('../../assets/images/widget-bg/1.jpg'),
  require('../../assets/images/widget-bg/2.jpg'),
  require('../../assets/images/widget-bg/3.jpg'),
]

const PHOTO_TEXT = {
  quoteColor: '#fbf9f8',
  metaColor: '#fed65b',
  attributionColor: 'rgba(251, 249, 248, 0.82)',
  actionBg: 'rgba(15, 18, 24, 0.55)',
  actionIconColor: '#fbf9f8',
  ornamentColor: '#fed65b',
  ornamentOpacity: 0.35,
  showOrnament: false,
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
    panelBg: 'rgba(253, 250, 248, 0.9)',
    panelBorderColor: 'rgba(233, 195, 73, 0.35)',
    accentBorderColor: '#e9c349',
    accentBorderWidth: 3,
    quoteColor: '#241a00',
    metaColor: '#574500',
    attributionColor: '#745c00',
    actionBg: 'rgba(254, 214, 91, 0.35)',
    actionIconColor: '#574500',
    ornamentColor: '#735c00',
    ornamentOpacity: 0.15,
    showOrnament: true,
    showLargeQuotes: false,
    shadow: '0 6px 18px rgba(115, 92, 0, 0.12)',
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
  glass: {
    id: 'glass',
    labelKey: 'settings.designGlass',
    panelBg: 'rgba(251, 249, 248, 0.55)',
    panelBorderColor: 'rgba(255, 255, 255, 0.55)',
    accentBorderColor: 'rgba(2, 26, 53, 0.2)',
    accentBorderWidth: 1,
    quoteColor: '#021a35',
    metaColor: '#334865',
    attributionColor: 'rgba(68, 71, 77, 0.85)',
    actionBg: 'rgba(255, 255, 255, 0.45)',
    actionIconColor: '#021a35',
    ornamentColor: '#021a35',
    ornamentOpacity: 0.12,
    showOrnament: false,
    showLargeQuotes: false,
    shadow: '0 8px 28px rgba(2, 26, 53, 0.12)',
  },
  ink: {
    id: 'ink',
    labelKey: 'settings.designInk',
    panelBg: 'rgba(25, 26, 24, 0.88)',
    panelBorderColor: 'rgba(200, 198, 195, 0.2)',
    accentBorderColor: '#e9c349',
    accentBorderWidth: 0,
    quoteColor: '#fbf9f8',
    metaColor: '#e9c349',
    attributionColor: 'rgba(200, 198, 195, 0.8)',
    actionBg: 'rgba(46, 47, 45, 0.9)',
    actionIconColor: '#e4e2de',
    ornamentColor: '#fed65b',
    ornamentOpacity: 0.18,
    showOrnament: false,
    showLargeQuotes: true,
    shadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
  },
  manuscript: {
    id: 'manuscript',
    labelKey: 'settings.designManuscript',
    panelBg: 'rgba(245, 243, 243, 0.94)',
    panelBorderColor: 'rgba(2, 26, 53, 0.12)',
    accentBorderColor: '#021a35',
    accentBorderWidth: 2,
    quoteColor: '#1a2f4b',
    metaColor: '#021a35',
    attributionColor: '#44474d',
    actionBg: 'rgba(212, 227, 255, 0.65)',
    actionIconColor: '#021a35',
    ornamentColor: '#8397b8',
    ornamentOpacity: 0.35,
    showOrnament: true,
    showLargeQuotes: true,
    shadow: '0 4px 16px rgba(2, 26, 53, 0.1)',
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

/** Map retired photo-style ids (vista/horizon) onto sanctuary. */
export function normalizeWidgetDesignId(value: unknown): WidgetDesignId {
  if (value === 'vista' || value === 'horizon' || value === 'sanctuary') {
    return 'sanctuary'
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

export function getRandomPoolBackgroundImage(index: number): ImageSourcePropType {
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
