import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Pressable, Text, View } from 'react-native'

import { shadowLevel1 } from '@/constants/colors'
import { pressableNoRipple } from '@/constants/pressable'
import {
  DEFAULT_QUOTE_FONT_SIZE,
  getQuoteLineHeight,
  WIDGET_QUOTE_FONT_WEIGHT,
  WIDGET_SOURCE_FONT_WEIGHT,
} from '@/constants/widget-layout'
import { DEFAULT_WIDGET_FONT, getWidgetFontFamily } from '@/fonts/registry'
import { useWidgetFont } from '@/fonts/use-widget-font'
import { t } from '@/i18n'
import type { Citation, FontStyle } from '@/types/citation'

export type CitationCardVariant = 'decorative' | 'minimalist' | 'featured'

type CitationCardProps = {
  citation: Citation
  variant?: CitationCardVariant
  fontStyle?: FontStyle
  fontSize?: number
  onUnsave?: () => void
  onSave?: () => void
  isSaved?: boolean
  className?: string
}

function sourceLabel(source: string) {
  return source.trim() || t('card.unknownSource')
}

/** Larger, always pinned to the card's bottom-right corner (vs. inline in the meta row). */
function CornerActionButton({
  icon,
  label,
  onPress,
  tone,
}: {
  icon: keyof typeof MaterialIcons.glyphMap
  label: string
  onPress: () => void
  tone: 'light' | 'dark'
}) {
  return (
    <Pressable
      {...pressableNoRipple}
      onPress={onPress}
      accessibilityLabel={label}
      className={`absolute bottom-3 right-3 h-12 w-12 items-center justify-center rounded-full ${
        tone === 'dark' ? 'bg-white/15' : 'bg-surface-bright'
      }`}
      style={shadowLevel1}
    >
      <MaterialIcons
        name={icon}
        size={22}
        color={tone === 'dark' ? '#ffffff' : '#44474d'}
      />
    </Pressable>
  )
}

export function CitationCard({
  citation,
  variant = 'decorative',
  fontStyle = DEFAULT_WIDGET_FONT,
  fontSize = DEFAULT_QUOTE_FONT_SIZE,
  onUnsave,
  onSave,
  isSaved = true,
  className = '',
}: CitationCardProps) {
  useWidgetFont(fontStyle)
  const fontFamily = getWidgetFontFamily(fontStyle)
  const lineHeight = getQuoteLineHeight(fontSize)
  const quoteStyle = {
    fontFamily,
    fontSize,
    lineHeight,
    fontWeight: WIDGET_QUOTE_FONT_WEIGHT,
  }
  const sourceStyle = {
    fontFamily,
    fontSize,
    lineHeight,
    fontWeight: WIDGET_SOURCE_FONT_WEIGHT,
  }

  if (variant === 'featured') {
    return (
      <View className={className}>
        <View
          className='relative min-h-[300px] items-center justify-center overflow-hidden rounded-xl p-10'
          style={shadowLevel1}
        >
          <View className='absolute inset-0 bg-primary/80' />
          <View className='relative z-10 max-w-3xl items-center gap-6'>
            <MaterialIcons
              name='format-quote'
              size={28}
              color='#fed65b'
              style={{ opacity: 0.8 }}
            />
            <Text className='text-center text-white' style={quoteStyle}>
              &quot;{citation.text}&quot;
            </Text>
            <Text
              className='uppercase text-secondary-fixed'
              style={sourceStyle}
            >
              {sourceLabel(citation.source)}
            </Text>
          </View>
          {onUnsave ? (
            <CornerActionButton
              icon='bookmark-remove'
              label={t('card.removeSaved')}
              onPress={onUnsave}
              tone='dark'
            />
          ) : null}
        </View>
      </View>
    )
  }

  const bgClass = 'bg-decorative-bg'
  const borderClass = variant === 'decorative' ? 'border-l-2 border-secondary' : ''

  return (
    <View className={className}>
      <View
        className={`relative gap-6 overflow-hidden rounded-xl p-6 pb-16 md:p-8 md:pb-16 ${bgClass} ${borderClass}`}
        style={shadowLevel1}
      >
        <Text className='relative z-10 text-primary' style={quoteStyle}>
          &quot;{citation.text}&quot;
        </Text>

        <View
          className={`${variant === 'minimalist' ? 'mt-auto border-t border-outline-variant pt-4' : ''}`}
        >
          <Text className='uppercase text-primary' style={sourceStyle}>
            {sourceLabel(citation.source)}
          </Text>
        </View>

        {isSaved && onUnsave ? (
          <CornerActionButton
            icon='bookmark-remove'
            label={t('card.removeSaved')}
            onPress={onUnsave}
            tone='light'
          />
        ) : null}
        {!isSaved && onSave ? (
          <CornerActionButton
            icon='bookmark-border'
            label={t('card.saveCitation')}
            onPress={onSave}
            tone='light'
          />
        ) : null}
      </View>
    </View>
  )
}
