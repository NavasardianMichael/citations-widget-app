import { Image, Text, View } from 'react-native'

import { t } from '@/i18n'

/** Capture resolution for social shares (portrait 4:5). */
export const CITATION_SHARE_CARD_WIDTH = 1080
export const CITATION_SHARE_CARD_HEIGHT = 1350

type CitationShareCardProps = {
  text: string
  source: string
  onLogoLoad?: () => void
}

/**
 * Off-screen social card rendered for `react-native-view-shot` capture.
 * Layout uses absolute pixel sizes so the PNG is sharp when shared.
 * Uses RN `Image` (not expo-image) so view-shot can capture the logo reliably.
 */
export function CitationShareCard({ text, source, onLogoLoad }: CitationShareCardProps) {
  return (
    <View
      collapsable={false}
      style={{
        width: CITATION_SHARE_CARD_WIDTH,
        height: CITATION_SHARE_CARD_HEIGHT,
        backgroundColor: '#0c1018',
        paddingHorizontal: 72,
        paddingTop: 72,
        paddingBottom: 80,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <Image
          source={require('../../assets/logo/logo.png')}
          style={{ width: 88, height: 88 }}
          resizeMode='contain'
          onLoad={onLogoLoad}
        />
        <Text
          style={{
            flex: 1,
            color: '#fed65b',
            fontSize: 36,
            lineHeight: 44,
            fontWeight: '700',
            letterSpacing: 0.4,
          }}
        >
          {t('common.brand')}
        </Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 48 }}>
        <Text
          style={{
            color: 'rgba(254, 214, 91, 0.45)',
            fontSize: 120,
            lineHeight: 120,
            marginBottom: -24,
          }}
        >
          “
        </Text>
        <Text
          style={{
            color: '#fbf9f8',
            fontSize: 52,
            lineHeight: 72,
            fontWeight: '500',
          }}
        >
          {text}
        </Text>
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.14)',
          paddingTop: 36,
          gap: 12,
        }}
      >
        <Text
          style={{
            color: '#fed65b',
            fontSize: 28,
            lineHeight: 36,
            fontWeight: '700',
            letterSpacing: 1.2,
          }}
        >
          {source}
        </Text>
        <Text
          style={{
            color: 'rgba(251, 249, 248, 0.55)',
            fontSize: 24,
            lineHeight: 32,
          }}
        >
          {t('settings.shareCardFooter')}
        </Text>
      </View>
    </View>
  )
}
