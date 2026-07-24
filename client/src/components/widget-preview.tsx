import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { ImageBackground, Pressable, Text, View } from 'react-native'

import { pressableNoRipple } from '@/constants/pressable'
import { getWidgetBackgroundImage, WIDGET_DESIGN_TOKENS } from '@/constants/widget-designs'
import { colorWithOpacity, getQuoteLineHeight, WIDGET_LAYOUT } from '@/constants/widget-layout'
import { getWidgetFontFamily } from '@/fonts/registry'
import { useWidgetFont } from '@/fonts/use-widget-font'
import { t } from '@/i18n'
import type { FontStyle, WidgetCitation } from '@/types/citation'

type WidgetPreviewProps = {
  citation: WidgetCitation | null
  fontStyle: FontStyle
  fontSize: number
  loading?: boolean
  showActions?: boolean
  onRefresh?: () => void
  onSave?: () => void
  onShare?: () => void
}

function PreviewActionIcon({
  icon,
  label,
  onPress,
  backgroundColor,
  iconColor,
}: {
  icon: keyof typeof MaterialIcons.glyphMap
  label: string
  onPress?: () => void
  backgroundColor: string
  iconColor: string
}) {
  const sizeStyle = {
    height: WIDGET_LAYOUT.actionSize,
    width: WIDGET_LAYOUT.actionSize,
    borderRadius: WIDGET_LAYOUT.actionSize / 2,
    backgroundColor,
  }

  if (!onPress) {
    return (
      <View
        accessibilityLabel={label}
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
        className='items-center justify-center'
        style={sizeStyle}
      >
        <MaterialIcons
          name={icon}
          size={WIDGET_LAYOUT.actionIconSize}
          color={iconColor}
        />
      </View>
    )
  }

  return (
    <Pressable
      {...pressableNoRipple}
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={label}
      className='items-center justify-center'
      style={sizeStyle}
    >
      <MaterialIcons
        name={icon}
        size={WIDGET_LAYOUT.actionIconSize}
        color={iconColor}
      />
    </Pressable>
  )
}

export function WidgetPreview({
  citation,
  fontStyle,
  fontSize,
  loading = false,
  showActions = true,
  onRefresh,
  onSave,
  onShare,
}: WidgetPreviewProps) {
  const fontReady = useWidgetFont(fontStyle)
  const tokens = WIDGET_DESIGN_TOKENS
  const backgroundImage = getWidgetBackgroundImage(citation?.backgroundImageIndex ?? 0)
  const fontFamily = getWidgetFontFamily(fontStyle)
  const quoteLineHeight = getQuoteLineHeight(fontSize)
  const previewActions: {
    icon: keyof typeof MaterialIcons.glyphMap
    label: string
    onPress?: () => void
  }[] = [
    { icon: 'refresh', label: t('settings.actionRefresh'), onPress: onRefresh },
    { icon: 'settings', label: t('settings.actionSettings') },
    { icon: 'bookmark', label: t('settings.actionBookmark'), onPress: onSave },
    { icon: 'share', label: t('settings.actionShare'), onPress: onShare },
  ]

  const showLoading = loading || (!!citation && !fontReady)

  const frameStyle = {
    minHeight: WIDGET_LAYOUT.previewMinHeight,
    borderRadius: WIDGET_LAYOUT.borderRadius,
    borderWidth: 1,
    borderColor: tokens.panelBorderColor,
    borderLeftWidth: Math.max(tokens.accentBorderWidth, 1),
    borderLeftColor: tokens.accentBorderColor,
    boxShadow: tokens.shadow,
    overflow: 'hidden' as const,
  }

  const contentPad = {
    padding: WIDGET_LAYOUT.padding,
    // Matches the real widget: top content and the meta/actions row anchor to
    // opposite ends of the frame instead of flowing directly under the quote.
    flex: 1,
    justifyContent: 'space-between' as const,
  }

  const topContent = showLoading ? (
    <Text
      style={{
        fontSize,
        lineHeight: quoteLineHeight,
        color: tokens.attributionColor,
      }}
    >
      {t('settings.previewLoading')}
    </Text>
  ) : citation ? (
    <Text
      style={{
        fontFamily,
        fontSize,
        lineHeight: quoteLineHeight,
        color: tokens.quoteColor,
      }}
    >
      &quot;{citation.text}&quot;
    </Text>
  ) : (
    <Text
      style={{
        fontSize,
        lineHeight: quoteLineHeight,
        color: tokens.attributionColor,
      }}
    >
      {t('settings.previewEmpty')}
    </Text>
  )

  const metaContent = citation ? (
    <View style={{ gap: WIDGET_LAYOUT.metaBlockGap, marginTop: WIDGET_LAYOUT.sectionGap }}>
      <View
        className='w-full flex-row flex-wrap items-center justify-end'
        style={{
          columnGap: WIDGET_LAYOUT.actionGap,
          rowGap: WIDGET_LAYOUT.sourceActionsGap,
        }}
      >
        <Text
          className='mr-auto min-w-0 uppercase'
          style={{
            color: tokens.metaColor,
            fontFamily,
            fontSize: WIDGET_LAYOUT.metaFontSize,
            lineHeight: WIDGET_LAYOUT.metaLineHeight,
            letterSpacing: WIDGET_LAYOUT.metaLetterSpacing,
            fontWeight: '600',
          }}
        >
          {citation.source || citation.category}
        </Text>
        {showActions ? (
          <View
            className='flex-row shrink-0'
            style={{ gap: WIDGET_LAYOUT.actionGap }}
          >
            {previewActions.map((action) => (
              <PreviewActionIcon
                key={action.icon}
                icon={action.icon}
                label={action.label}
                onPress={action.onPress}
                backgroundColor={tokens.actionBg}
                iconColor={tokens.actionIconColor}
              />
            ))}
          </View>
        ) : null}
      </View>
      {citation.addedBy ? (
        <Text
          style={{
            fontSize: WIDGET_LAYOUT.attributionFontSize,
            lineHeight: WIDGET_LAYOUT.attributionLineHeight,
            color: tokens.attributionColor,
          }}
        >
          {t('settings.addedBy', { name: citation.addedBy })}
        </Text>
      ) : null}
    </View>
  ) : null

  const ornaments = (
    <>
      {tokens.showOrnament ? (
        <View
          className='absolute'
          style={{
            top: WIDGET_LAYOUT.ornamentInset,
            right: WIDGET_LAYOUT.ornamentInset,
            opacity: tokens.ornamentOpacity,
            zIndex: 2,
          }}
        >
          <MaterialIcons
            name='flare'
            size={WIDGET_LAYOUT.ornamentIconSize}
            color={tokens.ornamentColor}
          />
        </View>
      ) : null}

      {tokens.showLargeQuotes ? (
        <Text
          className='absolute leading-none'
          style={{
            left: WIDGET_LAYOUT.padding / 2,
            top: WIDGET_LAYOUT.ornamentInset,
            fontSize: WIDGET_LAYOUT.largeQuoteFontSize,
            color: colorWithOpacity(
              tokens.ornamentColor,
              tokens.ornamentOpacity + 0.15,
            ),
            zIndex: 2,
          }}
        >
          “
        </Text>
      ) : null}
    </>
  )

  return (
    <View className='rounded-xl '>
      <View
        className='absolute top-0 left-6 z-10 rounded-full bg-secondary-container px-3 py-1'
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
      >
        <Text className='font-label-sm text-label-sm text-on-secondary-container'>
          {t('settings.livePreview')}
        </Text>
      </View>

      <ImageBackground
        source={backgroundImage}
        resizeMode='cover'
        className='relative mt-4'
        style={frameStyle}
        imageStyle={{ borderRadius: WIDGET_LAYOUT.borderRadius }}
      >
        <View
          style={{
            ...contentPad,
            backgroundColor: tokens.overlayColor,
            borderRadius: WIDGET_LAYOUT.borderRadius,
          }}
        >
          {ornaments}
          {topContent}
          {metaContent}
        </View>
      </ImageBackground>
    </View>
  )
}
