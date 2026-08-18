import {
  HStack,
  Image,
  Link,
  Rectangle,
  Spacer,
  Text,
  VStack,
  ZStack,
} from '@expo/ui/swift-ui'
import {
  background,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  opacity,
  padding,
  resizable,
  shapes,
  strokeBorder,
  underline,
  unredacted,
} from '@expo/ui/swift-ui/modifiers'
import { createWidget, type WidgetEnvironment } from 'expo-widgets'

import { IOS_WIDGET_NAME, type HomeWidgetSnapshot } from '@/widgets/types'

/**
 * The whole widget has to fit in this one function.
 *
 * `babel-preset-expo`'s widgets plugin stringifies only the body of a `'widget'`
 * function and stores it in the App Group; the extension evaluates that string in
 * a bare JavaScriptCore context whose globals are just `@expo/ui/swift-ui`
 * components + modifiers. Imports, shared constants (`WIDGET_LAYOUT`,
 * `buildWidgetActionUri`, …) and helper components declared at module scope are
 * `undefined` there, so the values below are deliberately duplicated inline.
 *
 * Two more extension-only constraints:
 * - Colors stay in CSS form (`#rrggbb` / `rgba()`). expo-modules-core reads
 *   8-digit hex as `#RRGGBBAA`, so the Android-style `#AARRGGBB` that
 *   `toArgbHex()` emits decodes with alpha and red swapped — that is what turned
 *   the panel background almost fully transparent.
 * - `Image` only honours the `resizable` modifier (`applyImageModifier`), so the
 *   action chips and the ornament are glyphs in a `Text`, not SF Symbols.
 * - Keys whose value is null are stripped before the push (`withoutNullProps`),
 *   because App Group `UserDefaults` rejects `NSNull`. Read every optional field
 *   as possibly absent, and note that props can be missing entirely — WidgetKit
 *   renders a placeholder entry before the app has ever synced.
 * - Fonts come from the App Group (`resolveIosWidgetFonts`) and are registered
 *   with Core Text by `withIosWidgetReleaseRedBox`. Both names can be missing —
 *   a widget can render before the app has ever copied the files — so every
 *   custom face falls back to the system font and Unicode glyphs.
 */
function CitationWidgetView(props: HomeWidgetSnapshot, environment: WidgetEnvironment) {
  'widget'

  const family = environment.widgetFamily
  const quote = props.isRefreshing
    ? props.loadingMessage || 'Բեռնվում է…'
    : props.quoteText || props.emptyMessage || 'Մեջբերում չկա'
  const source = props.isRefreshing ? '' : props.sourceText || ''

  // Lock Screen accessories render through WidgetKit's vibrancy engine, which
  // strips custom colors and chrome — hierarchical styles are the supported way
  // to stay legible across its light/dark/tinted appearances.
  if (family === 'accessoryInline') {
    return (
      <Text modifiers={[unredacted(), lineLimit(1)]}>
        {source ? quote + ' — ' + source : quote}
      </Text>
    )
  }

  if (family === 'accessoryRectangular') {
    return (
      <VStack
        alignment='leading'
        spacing={2}
        modifiers={[
          unredacted(),
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
        {source ? (
          <Text
            modifiers={[
              font({ size: 12, weight: 'regular' }),
              foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
              lineLimit(1),
            ]}
          >
            {source}
          </Text>
        ) : null}
      </VStack>
    )
  }

  const isSmall = family === 'systemSmall'
  // Mirrors WIDGET_LAYOUT; the 2×2 family gets tighter chrome so a full quote fits.
  const pad = isSmall ? 14 : 24
  const gap = isSmall ? 8 : 16
  const quoteSize = Math.max(11, (props.fontSize || 24) - (isSmall ? 8 : 0))

  const quoteColor = props.quoteColor || '#fbf9f8'
  const metaColor = props.metaColor || '#fed65b'
  const attributionColor = props.attributionColor || 'rgba(251, 249, 248, 0.82)'
  const panelBg = props.panelBg || 'rgba(18, 14, 12, 0.92)'
  const panelBorderColor = props.panelBorderColor || 'rgba(255, 255, 255, 0.18)'
  const accentColor = props.accentBorderColor || 'rgba(254, 214, 91, 0.65)'
  const accentWidth = Math.max(
    typeof props.accentBorderWidth === 'number' ? props.accentBorderWidth : 2,
    1,
  )
  const actionBg = props.actionBg || 'rgba(15, 18, 24, 0.55)'
  const actionIconColor = props.actionIconColor || '#fbf9f8'
  const ornamentColor = props.ornamentColor || '#fed65b'
  const ornamentOpacity =
    typeof props.ornamentOpacity === 'number' ? props.ornamentOpacity : 0.3
  const overlayColor = props.overlayColor || ''
  const imageUri = props.backgroundImageUri || ''
  const hasImage = imageUri.indexOf('file://') === 0
  const scrim = hasImage && overlayColor ? overlayColor : 'rgba(0, 0, 0, 0)'
  const showActions = Boolean(props.showActions) && !isSmall
  const hasQuoteToShare = Boolean(props.citationText && props.citationText.trim())

  // Core Text names of the App Group faces; empty until the app has synced once.
  const quoteFamily = props.iosFontFamily || ''
  const glyphFamily = props.iosGlyphFontFamily || ''

  const quoteFont = (size: number, weight: 'regular' | 'medium' | 'semibold' | 'bold') =>
    quoteFamily ? font({ family: quoteFamily, size, weight }) : font({ size, weight })

  // MaterialIcons codepoints (WIDGET_ICON_GLYPH) when the subset font made it
  // into the App Group, else Unicode look-alikes in the system font.
  const icon = {
    refresh: glyphFamily ? '\ue5d5' : '↻',
    saved: glyphFamily ? '\ue59a' : '★',
    unsaved: glyphFamily ? '\ue867' : '☆',
    share: glyphFamily ? '\ue80d' : '↗',
    flare: glyphFamily ? '\ue3e4' : '✦',
  }

  // Mirrors buildWidgetActionUri(): a widget tap can only open the app, so the
  // app performs the refresh/save/share work on launch.
  const actionUri = (action: string) => 'citationswidget://widget-action?action=' + action

  const chip = (glyph: string, destination: string) => {
    const button = (
      <Text
        modifiers={[
          glyphFamily
            ? font({ family: glyphFamily, size: 22 })
            : font({ size: 22, weight: 'medium' }),
          foregroundStyle(actionIconColor),
          opacity(destination ? 1 : 0.45),
          frame({ width: 40, height: 40, alignment: 'center' }),
          background(actionBg, shapes.circle()),
        ]}
      >
        {glyph}
      </Text>
    )
    return destination ? <Link destination={destination}>{button}</Link> : button
  }

  const attributionFont = (weight: 'regular' | 'semibold') => quoteFont(14, weight)

  return (
    <ZStack
      alignment='topLeading'
      modifiers={[
        unredacted(),
        containerBackground(hasImage && overlayColor ? overlayColor : panelBg, 'widget'),
        frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }),
        // Android draws its own 1px frame + corner radius; here ContainerRelativeShape
        // follows the radius the system already masks the widget with.
        strokeBorder({
          color: panelBorderColor,
          style: { lineWidth: 1 },
          shape: 'containerRelativeShape',
        }),
      ]}
    >
      {hasImage ? <Image uiImage={imageUri} modifiers={[resizable()]} /> : null}

      <VStack
        alignment='leading'
        spacing={0}
        modifiers={[
          padding({
            top: props.showOrnament || props.showLargeQuotes ? pad : 8,
            leading: pad,
            bottom: pad,
            trailing: pad,
          }),
          frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }),
          background(scrim),
        ]}
      >
        {props.showLargeQuotes ? (
          <Text
            modifiers={[
              quoteFont(48, 'bold'),
              foregroundStyle(ornamentColor),
              opacity(Math.min(1, ornamentOpacity + 0.15)),
            ]}
          >
            “
          </Text>
        ) : null}

        <VStack
          alignment='leading'
          spacing={gap}
          modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}
        >
          <Text
            modifiers={[
              quoteFont(quoteSize, 'semibold'),
              foregroundStyle(props.isRefreshing ? attributionColor : quoteColor),
              minimumScaleFactor(0.6),
              frame({ maxWidth: Infinity, alignment: 'leading' }),
            ]}
          >
            {quote}
          </Text>

          {source ? (
            <Text
              modifiers={[
                quoteFont(quoteSize, 'regular'),
                foregroundStyle(metaColor),
                minimumScaleFactor(0.7),
                frame({ maxWidth: Infinity, alignment: 'leading' }),
              ]}
            >
              {source}
            </Text>
          ) : null}
        </VStack>

        <Spacer />

        <VStack
          alignment='leading'
          spacing={12}
          modifiers={[
            padding({ top: gap }),
            frame({ maxWidth: Infinity, alignment: 'leading' }),
          ]}
        >
          {showActions ? (
            <HStack
              alignment='center'
              spacing={10}
              modifiers={[frame({ maxWidth: Infinity, alignment: 'trailing' })]}
            >
              <Spacer />
              {chip(icon.refresh, actionUri('refresh'))}
              {chip(
                props.isSaved ? icon.saved : icon.unsaved,
                props.citationId ? actionUri('toggle-save') : '',
              )}
              {chip(icon.share, hasQuoteToShare ? actionUri('share') : '')}
            </HStack>
          ) : null}

          {props.attributionName && !isSmall ? (
            <HStack alignment='lastTextBaseline' spacing={0}>
              {props.attributionBefore ? (
                <Text modifiers={[attributionFont('regular'), foregroundStyle(attributionColor)]}>
                  {props.attributionBefore}
                </Text>
              ) : null}

              {props.attributionUrl ? (
                <Link destination={props.attributionUrl}>
                  <Text
                    modifiers={[
                      attributionFont('semibold'),
                      foregroundStyle(attributionColor),
                      underline({ isActive: true, pattern: 'solid' }),
                    ]}
                  >
                    {props.attributionName}
                  </Text>
                </Link>
              ) : (
                <Text modifiers={[attributionFont('semibold'), foregroundStyle(attributionColor)]}>
                  {props.attributionName}
                </Text>
              )}

              {props.attributionAfter ? (
                <Text modifiers={[attributionFont('regular'), foregroundStyle(attributionColor)]}>
                  {props.attributionAfter}
                </Text>
              ) : null}
            </HStack>
          ) : null}
        </VStack>
      </VStack>

      {/* Above the content so the scrim can't cover it, like Android's accent edge. */}
      <Rectangle
        modifiers={[
          foregroundStyle(accentColor),
          frame({ width: accentWidth, maxHeight: Infinity }),
          frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }),
        ]}
      />

      {props.showOrnament ? (
        <Text
          modifiers={[
            glyphFamily ? font({ family: glyphFamily, size: 20 }) : font({ size: 20 }),
            foregroundStyle(ornamentColor),
            opacity(ornamentOpacity),
            padding({ all: 8 }),
            frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topTrailing' }),
          ]}
        >
          {icon.flare}
        </Text>
      ) : null}
    </ZStack>
  )
}

const CitationWidget = createWidget<HomeWidgetSnapshot>(
  IOS_WIDGET_NAME,
  CitationWidgetView,
)

export default CitationWidget
