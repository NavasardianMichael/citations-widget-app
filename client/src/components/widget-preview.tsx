import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Pressable, Text, View } from 'react-native'

import { pressableNoRipple } from '@/constants/pressable'
import {
  DEFAULT_WIDGET_DESIGN,
  getWidgetDesign,
  type WidgetDesignId,
} from '@/constants/widget-designs'
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
  if (!onPress) {
    return (
      <View
        accessibilityLabel={label}
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
        className='h-8 w-8 items-center justify-center rounded-full'
        style={{ backgroundColor }}
      >
        <MaterialIcons name={icon} size={18} color={iconColor} />
      </View>
    )
  }

  return (
    <Pressable
      {...pressableNoRipple}
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={label}
      className='h-8 w-8 items-center justify-center rounded-full'
      style={{ backgroundColor }}
    >
      <MaterialIcons name={icon} size={18} color={iconColor} />
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

  return (
    <View className='rounded-xl '>
      <View
        className='absolute top-2 left-6 z-10 rounded-full bg-secondary-container px-3 py-1'
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
      >
        <Text className='font-label-sm text-label-sm text-on-secondary-container'>
          {t('settings.livePreview')}
        </Text>
      </View>

      <View
        className='relative mt-4 rounded-lg p-8'
        style={{
          backgroundColor: tokens.panelBg,
          borderWidth: 1,
          borderColor: tokens.panelBorderColor,
          borderLeftWidth: Math.max(tokens.accentBorderWidth, 1),
          borderLeftColor: tokens.accentBorderColor,
          boxShadow: tokens.shadow,
        }}
      >
        {tokens.showOrnament ? (
          <View
            className='absolute right-2 top-2'
            style={{ opacity: tokens.ornamentOpacity }}
          >
            <MaterialIcons
              name='flare'
              size={20}
              color={tokens.ornamentColor}
            />
          </View>
        ) : null}

        {tokens.showLargeQuotes ? (
          <Text
            className='absolute left-4 top-2 text-5xl leading-none'
            style={{
              color: tokens.ornamentColor,
              opacity: tokens.ornamentOpacity + 0.15,
            }}
          >
            “
          </Text>
        ) : null}

        {showLoading ? (
          <Text
            className='font-body-md text-body-md'
            style={{ color: tokens.attributionColor }}
          >
            {t('settings.previewLoading')}
          </Text>
        ) : citation ? (
          <View className='gap-6'>
            <Text
              className='text-body-md leading-relaxed'
              style={{
                fontFamily: getWidgetFontFamily(fontStyle),
                color: tokens.quoteColor,
              }}
            >
              &quot;{citation.text}&quot;
            </Text>
            <View className='gap-3'>
              <View className='w-full flex-row flex-wrap items-center justify-end gap-3'>
                <Text
                  className='mr-auto min-w-0 text-label-sm uppercase tracking-wider'
                  style={{
                    color: tokens.metaColor,
                    fontFamily: getWidgetFontFamily(fontStyle),
                  }}
                >
                  {citation.source ?? citation.author ?? citation.category}
                </Text>
                {showActions ? (
                  <View className='flex-row shrink-0 gap-2'>
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
                  className='text-sm'
                  style={{ color: tokens.attributionColor }}
                >
                  {t('settings.addedBy', { name: citation.addedBy })}
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <Text
            className='font-body-md text-body-md'
            style={{ color: tokens.attributionColor }}
          >
            {t('settings.previewEmpty')}
          </Text>
        )}
      </View>
    </View>
  )
}
