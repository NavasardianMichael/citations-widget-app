import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui'
import {
  background,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  opacity,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers'
import { createWidget, type WidgetEnvironment } from 'expo-widgets'

import {
  DEFAULT_WIDGET_DESIGN,
  getWidgetDesign,
} from '@/constants/widget-designs'
import {
  colorWithOpacity,
  DEFAULT_QUOTE_FONT_SIZE,
  WIDGET_LAYOUT,
} from '@/constants/widget-layout'
import { toArgbHex } from '@/widgets/color'
import type { HomeWidgetSnapshot } from '@/widgets/types'
import { IOS_WIDGET_NAME } from '@/widgets/types'

const emptyDesign = getWidgetDesign(DEFAULT_WIDGET_DESIGN)

const EMPTY_SNAPSHOT: HomeWidgetSnapshot = {
  quoteText: '',
  sourceText: '',
  attributionText: null,
  showActions: false,
  citationId: null,
  citationText: '',
  citationSource: '',
  citationCategory: null,
  isSaved: false,
  designId: emptyDesign.id,
  backgroundImageIndex: 0,
  fontFamily: 'DavelAghvor',
  androidFontFile: 'davel-aghvor',
  fontSize: DEFAULT_QUOTE_FONT_SIZE,
  panelBg: emptyDesign.panelBg,
  panelBorderColor: emptyDesign.panelBorderColor,
  accentBorderColor: emptyDesign.accentBorderColor,
  accentBorderWidth: emptyDesign.accentBorderWidth,
  quoteColor: emptyDesign.quoteColor,
  metaColor: emptyDesign.metaColor,
  attributionColor: emptyDesign.attributionColor,
  actionBg: emptyDesign.actionBg,
  actionIconColor: emptyDesign.actionIconColor,
  ornamentColor: emptyDesign.ornamentColor,
  ornamentOpacity: emptyDesign.ornamentOpacity,
  showOrnament: emptyDesign.showOrnament,
  showLargeQuotes: emptyDesign.showLargeQuotes,
  overlayColor: emptyDesign.overlayColor ?? null,
  hasBackgroundImage: Boolean(emptyDesign.randomBackground),
  emptyMessage: '',
  loadingMessage: '',
  isRefreshing: false,
  isSaving: false,
  fetchedAt: 0,
}

function ActionChip({
  label,
  iconColor,
  actionBg,
}: {
  label: string
  iconColor: string
  actionBg: string
}) {
  return (
    <Text
      modifiers={[
        font({ size: WIDGET_LAYOUT.actionIconSize, weight: 'medium' }),
        foregroundStyle(toArgbHex(iconColor)),
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
}

function CitationWidgetView(
  props: HomeWidgetSnapshot,
  _environment: WidgetEnvironment,
) {
  'widget'
  const data = { ...EMPTY_SNAPSHOT, ...props }
  const largeQuoteColor = colorWithOpacity(
    data.ornamentColor,
    Math.min(1, data.ornamentOpacity + 0.15),
  )
  // Photo bitmaps are not available in the iOS widget extension yet — use the
  // design's dark panel / overlay so text contrast still matches preview.
  const iosBg = data.overlayColor || data.panelBg

  return (
    <VStack
      spacing={0}
      alignment='leading'
      modifiers={[
        containerBackground(toArgbHex(iosBg), 'widget'),
        padding({ all: WIDGET_LAYOUT.padding }),
        frame({
          maxWidth: Infinity,
          maxHeight: Infinity,
          alignment: 'topLeading',
        }),
      ]}
    >
      {data.showOrnament ? (
        <HStack modifiers={[frame({ maxWidth: Infinity })]}>
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

      {data.showLargeQuotes ? (
        <Text
          modifiers={[
            font({
              size: WIDGET_LAYOUT.largeQuoteFontSize,
              weight: 'bold',
              family: data.fontFamily,
            }),
            foregroundStyle(toArgbHex(largeQuoteColor)),
          ]}
        >
          “
        </Text>
      ) : null}

      <Text
        modifiers={[
          font({
            size: data.fontSize,
            weight: 'semibold',
            family: data.fontFamily,
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
              size: WIDGET_LAYOUT.metaFontSize,
              weight: 'regular',
              family: data.fontFamily,
            }),
            foregroundStyle(toArgbHex(data.metaColor)),
            padding({ top: WIDGET_LAYOUT.metaBlockGap }),
            frame({ maxWidth: Infinity, alignment: 'leading' }),
          ]}
        >
          {data.sourceText.toUpperCase()}
        </Text>
      ) : null}

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
            />
            <ActionChip
              label={data.isSaved ? '✕' : '☆'}
              iconColor={data.actionIconColor}
              actionBg={data.actionBg}
            />
            <ActionChip
              label='↗'
              iconColor={data.actionIconColor}
              actionBg={data.actionBg}
            />
          </HStack>
        ) : null}

        {data.attributionText ? (
          <Text
            modifiers={[
              font({
                size: WIDGET_LAYOUT.attributionFontSize,
                weight: 'regular',
                family: data.fontFamily,
              }),
              foregroundStyle(toArgbHex(data.attributionColor)),
            ]}
          >
            {data.attributionText}
          </Text>
        ) : null}
      </VStack>
    </VStack>
  )
}

const CitationWidget = createWidget<HomeWidgetSnapshot>(
  IOS_WIDGET_NAME,
  CitationWidgetView,
)

export default CitationWidget
