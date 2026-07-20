import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { ImageBackground, Pressable, Text, View } from 'react-native'

import { pressableNoRipple } from '@/constants/pressable'
import {
  DEFAULT_WIDGET_DESIGN,
  getWidgetDesign,
  type WidgetDesignId,
} from '@/constants/widget-designs'
import { colorWithOpacity, WIDGET_LAYOUT } from '@/constants/widget-layout'
import { getWidgetFontFamily } from '@/fonts/registry'
import { useWidgetFont } from '@/fonts/use-widget-font'
import { t } from '@/i18n'
import type { FontStyle, WidgetCitation } from '@/types/citation'

type WidgetPreviewProps = {
  citation: WidgetCitation | null
  fontStyle: FontStyle
  design?: WidgetDesignId
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
  design = DEFAULT_WIDGET_DESIGN,
  loading = false,
  showActions = true,
  onRefresh,
  onSave,
  onShare,
}: WidgetPreviewProps) {
  const fontReady = useWidgetFont(fontStyle)
  const tokens = getWidgetDesign(design)
  const fontFamily = getWidgetFontFamily(fontStyle)
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
  const hasPhoto = !!tokens.backgroundImage

  const frameStyle = {
    borderRadius: WIDGET_LAYOUT.borderRadius,
    borderWidth: 1,
    borderColor: tokens.panelBorderColor,
    borderLeftWidth: Math.max(tokens.accentBorderWidth, 1),
    borderLeftColor: tokens.accentBorderColor,
    boxShadow: tokens.shadow,
    overflow: 'hidden' as const,
  }

  const contentPad = { padding: WIDGET_LAYOUT.padding }

  const content = showLoading ? (
    <Text
      style={{
        fontSize: WIDGET_LAYOUT.quoteFontSize,
        lineHeight: WIDGET_LAYOUT.quoteLineHeight,
        color: tokens.attributionColor,
      }}
    >
      {t('settings.previewLoading')}
    </Text>
  ) : citation ? (
    <View style={{ gap: WIDGET_LAYOUT.sectionGap }}>
      <Text
        style={{
          fontFamily,
          fontSize: WIDGET_LAYOUT.quoteFontSize,
          lineHeight: WIDGET_LAYOUT.quoteLineHeight,
          color: tokens.quoteColor,
        }}
      >
        &quot;{citation.text}&quot;
      </Text>
      <View style={{ gap: WIDGET_LAYOUT.metaBlockGap }}>
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
            {citation.source ?? citation.author ?? citation.category}
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
    </View>
  ) : (
    <Text
      style={{
        fontSize: WIDGET_LAYOUT.quoteFontSize,
        lineHeight: WIDGET_LAYOUT.quoteLineHeight,
        color: tokens.attributionColor,
      }}
    >
      {t('settings.previewEmpty')}
    </Text>
  )

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

      {hasPhoto && tokens.backgroundImage ? (
        <ImageBackground
          source={tokens.backgroundImage}
          resizeMode='cover'
          className='relative mt-4'
          style={frameStyle}
          imageStyle={{ borderRadius: WIDGET_LAYOUT.borderRadius }}
        >
          <View
            style={{
              ...contentPad,
              backgroundColor: tokens.overlayColor ?? 'rgba(0,0,0,0.42)',
              borderRadius: WIDGET_LAYOUT.borderRadius,
            }}
          >
            {ornaments}
            {content}
          </View>
        </ImageBackground>
      ) : (
        <View
          className='relative mt-4'
          style={{
            ...frameStyle,
            ...contentPad,
            backgroundColor: tokens.panelBg,
          }}
        >
          {ornaments}
          {content}
        </View>
      )}
    </View>
  )
}
