import { HStack, Image, Link, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui'
import {
  aspectRatio,
  background,
  clipped,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  opacity,
  padding,
  resizable,
  shapes,
  underline,
} from '@expo/ui/swift-ui/modifiers'
import { createWidget, type WidgetEnvironment, type WidgetFamily } from 'expo-widgets'

// Widget-extension JS cannot load `@/constants/widget-designs` (it `require()`s
// every sanctuary JPEG) or `font({ family })` (faces live in the app target).
// Either one fails the timeline and the gallery shows three blank sizes.

import {
  colorWithOpacity,
  DEFAULT_QUOTE_FONT_SIZE,
  getWidgetContentPaddingTop,
  WIDGET_LAYOUT,
} from '@/constants/widget-layout'
import { buildWidgetActionUri } from '@/widgets/widget-action-uri'
import { toArgbHex } from '@/widgets/color'
import type { HomeWidgetSnapshot } from '@/widgets/types'
import { IOS_WIDGET_NAME } from '@/widgets/types'

const EMPTY_SNAPSHOT: HomeWidgetSnapshot = {
  quoteText: '',
  sourceText: '',
  attributionText: null,
  attributionBefore: '',
  attributionName: null,
  attributionAfter: '',
  attributionUrl: null,
  showActions: false,
  citationId: null,
  citationText: '',
  citationSource: '',
  citationCategory: null,
  isSaved: false,
  designId: 'sanctuary',
  backgroundImageIndex: 0,
  backgroundImageUri: null,
  fontFamily: 'System',
  androidFontFile: 'davel-aghvor',
  fontSize: DEFAULT_QUOTE_FONT_SIZE,
  panelBg: '#FF12100C',
  panelBorderColor: '#38FFFFFF',
  accentBorderColor: '#A6FED65B',
  accentBorderWidth: 2,
  quoteColor: '#fbf9f8',
  metaColor: '#fed65b',
  attributionColor: '#D1FBF9F8',
  actionBg: '#8C0F1218',
  actionIconColor: '#fbf9f8',
  ornamentColor: '#fed65b',
  ornamentOpacity: 0.35,
  showOrnament: true,
  showLargeQuotes: false,
  overlayColor: '#B80C0A08',
  hasBackgroundImage: true,
  emptyMessage: 'Մեջբերում չկա',
  loadingMessage: 'Մեջբերումը բեռնվում է…',
  isRefreshing: false,
  isSaving: false,
  quotePageIndex: 0,
  fetchedAt: 0,
}

/**
 * `destination` deep-links into the app (`citationswidget://widget-action?…`) —
 * WidgetKit extensions on iOS can only run pure, I/O-free JS at tap time
 * (no fetch, no native modules), so anything needing the network or the
 * share sheet opens the app briefly to do the work, unlike Android's fully
 * headless task handler. Omitting `destination` renders an inert, dimmed chip.
 */
function ActionChip({
  label,
  iconColor,
  actionBg,
  destination,
}: {
  label: string
  iconColor: string
  actionBg: string
  destination?: string
}) {
  const chip = (
    <Text
      modifiers={[
        font({ size: WIDGET_LAYOUT.actionIconSize, weight: 'medium' }),
        foregroundStyle(
          toArgbHex(destination ? iconColor : colorWithOpacity(iconColor, 0.45)),
        ),
        background(
          toArgbHex(actionBg),
          shapes.roundedRectangle({
            cornerRadius: WIDGET_LAYOUT.actionSize / 2,
          }),
        ),
        frame({
          width: WIDGET_LAYOUT.actionSize,
          height: WIDGET_LAYOUT.actionSize,
          alignment: 'center',
        }),
      ]}
    >
      {label}
    </Text>
  )

  return destination ? <Link destination={destination}>{chip}</Link> : chip
}

const ACCESSORY_FAMILIES: readonly WidgetFamily[] = [
  'accessoryRectangular',
  'accessoryInline',
]

/**
 * Lock Screen accessory widgets render through WidgetKit's vibrancy engine
 * ("vibrant" mode): custom colors, background images, and multi-element chrome
 * are stripped or ignored, so this intentionally skips the panel design,
 * ornament, actions, and attribution used on the home screen. `hierarchical`
 * foreground styles are the supported way to stay legible across the system's
 * light/dark/tinted lock screen appearances.
 */
function AccessoryWidgetView(data: HomeWidgetSnapshot, family: WidgetFamily) {
  const quote = data.isRefreshing
    ? data.loadingMessage || data.emptyMessage
    : data.quoteText || data.emptyMessage

  if (family === 'accessoryInline') {
    const inlineText =
      !data.isRefreshing && data.sourceText ? `${quote} — ${data.sourceText}` : quote
    return (
      <Text modifiers={[lineLimit(1)]}>{inlineText}</Text>
    )
  }

  return (
    <VStack
      alignment='leading'
      spacing={2}
      modifiers={[
        containerBackground(toArgbHex('rgba(0,0,0,0)'), 'widget'),
        frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }),
      ]}
    >
      <Text
        modifiers={[
          font({ size: 14, weight: 'semibold' }),
          foregroundStyle({ type: 'hierarchical', style: 'primary' }),
          lineLimit(3),
        ]}
      >
        {quote}
      </Text>

      {!data.isRefreshing && data.sourceText ? (
        <Text
          modifiers={[
            font({ size: 12, weight: 'regular' }),
            foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
            lineLimit(1),
          ]}
        >
          {data.sourceText}
        </Text>
      ) : null}
    </VStack>
  )
}

function CitationWidgetView(
  props: HomeWidgetSnapshot,
  environment: WidgetEnvironment,
) {
  'widget'
  const data = { ...EMPTY_SNAPSHOT, ...props }

  if (ACCESSORY_FAMILIES.includes(environment.widgetFamily)) {
    return AccessoryWidgetView(data, environment.widgetFamily)
  }

  const largeQuoteColor = colorWithOpacity(
    data.ornamentColor,
    Math.min(1, data.ornamentOpacity + 0.15),
  )
  // Solid designs paint their panel color directly as the container background.
  // Sanctuary (photo) falls back to the same color if the image failed to copy
  // into the shared App Group directory (see `resolveIosBackgroundImageUri`).
  const iosBg = data.overlayColor || data.panelBg

  return (
    <ZStack
      alignment='topLeading'
      modifiers={[
        containerBackground(toArgbHex(iosBg), 'widget'),
        frame({ maxWidth: Infinity, maxHeight: Infinity }),
      ]}
    >
      {data.backgroundImageUri?.startsWith('file://') ? (
        <Image
          uiImage={data.backgroundImageUri}
          modifiers={[
            resizable(),
            aspectRatio({ contentMode: 'fill' }),
            frame({ maxWidth: Infinity, maxHeight: Infinity }),
            clipped(),
          ]}
        />
      ) : null}

      <VStack
        spacing={0}
        alignment='leading'
        modifiers={[
          ...(data.backgroundImageUri && data.overlayColor
            ? [background(toArgbHex(data.overlayColor))]
            : []),
          padding({
            top: getWidgetContentPaddingTop(
              data.showOrnament || data.showLargeQuotes,
            ),
            leading: WIDGET_LAYOUT.padding,
            bottom: WIDGET_LAYOUT.padding,
            trailing: WIDGET_LAYOUT.padding,
          }),
          frame({
            maxWidth: Infinity,
            maxHeight: Infinity,
            alignment: 'topLeading',
          }),
        ]}
      >
        {data.showLargeQuotes ? (
          <Text
            modifiers={[
              font({
                size: WIDGET_LAYOUT.largeQuoteFontSize,
                weight: 'bold',
              }),
              foregroundStyle(toArgbHex(largeQuoteColor)),
            ]}
          >
            “
          </Text>
        ) : null}

        <VStack
          spacing={WIDGET_LAYOUT.quoteSourceGap}
          alignment='leading'
          modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}
        >
          <Text
            modifiers={[
              font({
                size: data.fontSize,
                weight: 'semibold',
              }),
              foregroundStyle(
                toArgbHex(
                  data.isRefreshing ? data.attributionColor : data.quoteColor,
                ),
              ),
              frame({ maxWidth: Infinity, alignment: 'leading' }),
            ]}
          >
            {data.isRefreshing
              ? data.loadingMessage || data.emptyMessage
              : data.quoteText || data.emptyMessage}
          </Text>

          {!data.isRefreshing && data.sourceText ? (
            <Text
              modifiers={[
                font({
                  size: data.fontSize,
                  weight: 'regular',
                }),
                foregroundStyle(toArgbHex(data.metaColor)),
                frame({ maxWidth: Infinity, alignment: 'leading' }),
              ]}
            >
              {data.sourceText}
            </Text>
          ) : null}
        </VStack>

        <Spacer />

        <VStack
          spacing={WIDGET_LAYOUT.metaBlockGap}
          alignment='leading'
          modifiers={[
            padding({ top: WIDGET_LAYOUT.sectionGap }),
            frame({ maxWidth: Infinity, alignment: 'leading' }),
          ]}
        >
          {data.showActions ? (
            <HStack
              spacing={WIDGET_LAYOUT.actionGap}
              alignment='center'
              modifiers={[frame({ maxWidth: Infinity, alignment: 'trailing' })]}
            >
              <Spacer />
              <ActionChip
                label='↻'
                iconColor={data.actionIconColor}
                actionBg={data.actionBg}
                destination={buildWidgetActionUri('refresh')}
              />
              <ActionChip
                label={data.isSaved ? '✕' : '☆'}
                iconColor={data.actionIconColor}
                actionBg={data.actionBg}
                destination={
                  data.citationId ? buildWidgetActionUri('toggle-save') : undefined
                }
              />
              <ActionChip
                label='↗'
                iconColor={data.actionIconColor}
                actionBg={data.actionBg}
                destination={
                  data.citationText.trim()
                    ? buildWidgetActionUri('share')
                    : undefined
                }
              />
            </HStack>
          ) : null}

          {data.attributionName ? (
            <HStack spacing={0} alignment='lastTextBaseline'>
              {data.attributionBefore ? (
                <Text
                  modifiers={[
                    font({
                      size: WIDGET_LAYOUT.attributionFontSize,
                      weight: 'regular',
                    }),
                    foregroundStyle(toArgbHex(data.attributionColor)),
                  ]}
                >
                  {data.attributionBefore}
                </Text>
              ) : null}
              {data.attributionUrl ? (
                <Link destination={data.attributionUrl}>
                  <Text
                    modifiers={[
                      font({
                        size: WIDGET_LAYOUT.attributionFontSize,
                        weight: 'semibold',
                      }),
                      foregroundStyle(toArgbHex(data.attributionColor)),
                      underline({ isActive: true, pattern: 'solid' }),
                    ]}
                  >
                    {data.attributionName}
                  </Text>
                </Link>
              ) : (
                <Text
                  modifiers={[
                    font({
                      size: WIDGET_LAYOUT.attributionFontSize,
                      weight: 'semibold',
                    }),
                    foregroundStyle(toArgbHex(data.attributionColor)),
                  ]}
                >
                  {data.attributionName}
                </Text>
              )}
              {data.attributionAfter ? (
                <Text
                  modifiers={[
                    font({
                      size: WIDGET_LAYOUT.attributionFontSize,
                      weight: 'regular',
                    }),
                    foregroundStyle(toArgbHex(data.attributionColor)),
                  ]}
                >
                  {data.attributionAfter}
                </Text>
              ) : null}
            </HStack>
          ) : null}
        </VStack>
      </VStack>

      {data.showOrnament ? (
        <HStack
          modifiers={[
            padding({ all: WIDGET_LAYOUT.ornamentInset }),
            frame({ maxWidth: Infinity, alignment: 'topTrailing' }),
          ]}
        >
          <Spacer />
          <Text
            modifiers={[
              font({ size: WIDGET_LAYOUT.ornamentIconSize, weight: 'regular' }),
              foregroundStyle(toArgbHex(data.ornamentColor)),
              opacity(data.ornamentOpacity),
            ]}
          >
            ✦
          </Text>
        </HStack>
      ) : null}
    </ZStack>
  )
}

const CitationWidget = createWidget<HomeWidgetSnapshot>(
  IOS_WIDGET_NAME,
  CitationWidgetView,
)

export default CitationWidget
