/**
 * The single home-widget look — "Սրբավայր": one dark photo panel. Its background is
 * picked at random from WIDGET_BACKGROUND_IMAGES whenever a new citation is fetched, and
 * that pick is persisted alongside the citation so Settings' live preview and the real
 * home-screen widget always show the same photo for the same citation.
 *
 * Keep WIDGET_BACKGROUND_IMAGES' length in sync with the server's
 * WIDGET_BACKGROUND_IMAGE_COUNT (server/src/routes/widget.ts).
 */
import type { ImageSourcePropType } from 'react-native'

export const WIDGET_STYLE_LABEL_KEY = 'settings.designSanctuary' as const

export const WIDGET_BACKGROUND_IMAGES: ImageSourcePropType[] = [
  require('../../assets/images/widget-bg/1.jpg'),
  require('../../assets/images/widget-bg/2.jpg'),
  require('../../assets/images/widget-bg/3.jpg'),
]

export type WidgetDesignTokens = {
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
  overlayColor: string
  shadow: string
}

export const WIDGET_DESIGN_TOKENS: WidgetDesignTokens = {
  panelBg: 'rgba(12, 16, 24, 0.92)',
  panelBorderColor: 'rgba(255, 255, 255, 0.22)',
  accentBorderColor: 'rgba(254, 214, 91, 0.65)',
  accentBorderWidth: 2,
  quoteColor: '#fbf9f8',
  metaColor: '#fed65b',
  attributionColor: 'rgba(251, 249, 248, 0.82)',
  actionBg: 'rgba(15, 18, 24, 0.55)',
  actionIconColor: '#fbf9f8',
  ornamentColor: '#fed65b',
  ornamentOpacity: 0.35,
  showOrnament: true,
  showLargeQuotes: false,
  overlayColor: 'rgba(8, 12, 20, 0.72)',
  shadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
}

/** Roll a new random background image index — call once per freshly-fetched citation. */
export function pickBackgroundImageIndex(): number {
  return Math.floor(Math.random() * WIDGET_BACKGROUND_IMAGES.length)
}

export function getWidgetBackgroundImage(index: number): ImageSourcePropType {
  const count = WIDGET_BACKGROUND_IMAGES.length
  const safeIndex = ((index % count) + count) % count
  return WIDGET_BACKGROUND_IMAGES[safeIndex]
}
