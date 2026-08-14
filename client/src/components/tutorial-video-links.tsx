import { Linking, Pressable, Text, View } from 'react-native'

import { pressableNoRipple } from '@/constants/pressable'
import { TUTORIAL_VIDEO_URLS } from '@/constants/tutorial-videos'
import { t, type MessageKey } from '@/i18n'

const LINKS: { key: keyof typeof TUTORIAL_VIDEO_URLS; labelKey: MessageKey }[] =
  [
    { key: 'android', labelKey: 'tutorial.videoGuideAndroid' },
    { key: 'ios', labelKey: 'tutorial.videoGuideIos' },
  ]

function openVideo(url: string) {
  if (!url) return
  void Linking.openURL(url).catch(() => undefined)
}

/** "Video guides" subtitle plus one YouTube link per OS. */
export function TutorialVideoLinks({ className = '' }: { className?: string }) {
  return (
    <View className={`gap-1 ${className}`}>
      <Text className='text-center font-label-sm text-label-sm text-on-surface-variant'>
        {t('tutorial.videoGuides')}
      </Text>
      <View className='flex-row flex-wrap items-center justify-center gap-4'>
        {LINKS.map((link) => (
          <Pressable
            {...pressableNoRipple}
            key={link.key}
            onPress={() => openVideo(TUTORIAL_VIDEO_URLS[link.key])}
            accessibilityRole='link'
            hitSlop={8}
            className='py-1'
          >
            <Text className='font-body-md text-body-md text-primary underline'>
              {t(link.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
