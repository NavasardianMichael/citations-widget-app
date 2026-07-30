import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useMemo, useState, type ComponentType } from 'react'
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/ui/button'
import { FilterPill } from '@/components/ui/filter-pill'
import {
  AndroidDragIllustration,
  AndroidResizeIllustration,
  AndroidWidgetsMenuIllustration,
  IosAddButtonIllustration,
  IosChooseSizeIllustration,
  IosPlaceDoneIllustration,
  LongPressIllustration,
  WelcomeIllustration,
} from '@/components/tutorial-illustrations'
import { WidgetPreview } from '@/components/widget-preview'
import { pressableNoRipple } from '@/constants/pressable'
import { DEFAULT_WIDGET_DESIGN } from '@/constants/widget-designs'
import { DEFAULT_QUOTE_FONT_SIZE } from '@/constants/widget-layout'
import { useOnboarding } from '@/contexts/onboarding-context'
import { DEFAULT_WIDGET_FONT } from '@/fonts/registry'
import { t, type MessageKey } from '@/i18n'
import type { WidgetCitation } from '@/types/citation'

type TutorialOS = 'ios' | 'android'

type TutorialStep = {
  key: string
  titleKey: MessageKey
  bodyKey: MessageKey
  bodyParams?: Record<string, string>
  Illustration: ComponentType
}

/** Purely illustrative — never fetched, never saved. */
const SAMPLE_CITATION: WidgetCitation = {
  id: 'tutorial-sample',
  text: 'Որովհետև Աստված այնպես սիրեց աշխարհը, որ մատնեց Իր միածին Որդուն։',
  source: 'Հովհաննես 3:16',
  category: 'bible',
  addedBy: null,
}

function CustomizeIllustration() {
  return (
    <View className='w-56'>
      <WidgetPreview
        citation={SAMPLE_CITATION}
        fontStyle={DEFAULT_WIDGET_FONT}
        fontSize={DEFAULT_QUOTE_FONT_SIZE}
        design={DEFAULT_WIDGET_DESIGN}
        showActions={false}
        showLivePreviewLabel={false}
      />
    </View>
  )
}

function buildSteps(os: TutorialOS): TutorialStep[] {
  const appName = t('common.brand')

  return [
    {
      key: 'welcome',
      titleKey: 'tutorial.welcome.title',
      bodyKey: 'tutorial.welcome.body',
      Illustration: WelcomeIllustration,
    },
    {
      key: 'longPress',
      titleKey: 'tutorial.longPress.title',
      bodyKey: 'tutorial.longPress.body',
      Illustration: LongPressIllustration,
    },
    os === 'ios'
      ? {
          key: 'addMenu',
          titleKey: 'tutorial.ios.addMenu.title',
          bodyKey: 'tutorial.ios.addMenu.body',
          Illustration: IosAddButtonIllustration,
        }
      : {
          key: 'addMenu',
          titleKey: 'tutorial.android.addMenu.title',
          bodyKey: 'tutorial.android.addMenu.body',
          Illustration: AndroidWidgetsMenuIllustration,
        },
    os === 'ios'
      ? {
          key: 'place',
          titleKey: 'tutorial.ios.chooseSize.title',
          bodyKey: 'tutorial.ios.chooseSize.body',
          bodyParams: { appName },
          Illustration: IosChooseSizeIllustration,
        }
      : {
          key: 'place',
          titleKey: 'tutorial.android.dragToScreen.title',
          bodyKey: 'tutorial.android.dragToScreen.body',
          bodyParams: { appName },
          Illustration: AndroidDragIllustration,
        },
    os === 'ios'
      ? {
          key: 'finish',
          titleKey: 'tutorial.ios.placeAndDone.title',
          bodyKey: 'tutorial.ios.placeAndDone.body',
          Illustration: IosPlaceDoneIllustration,
        }
      : {
          key: 'finish',
          titleKey: 'tutorial.android.resize.title',
          bodyKey: 'tutorial.android.resize.body',
          Illustration: AndroidResizeIllustration,
        },
    {
      key: 'customize',
      titleKey: 'tutorial.customize.title',
      bodyKey: 'tutorial.customize.body',
      Illustration: CustomizeIllustration,
    },
  ]
}

const OS_TOGGLE_STEP_KEYS = new Set(['addMenu', 'place', 'finish'])

export function TutorialModal() {
  const { visible, closeTutorial } = useOnboarding()
  const insets = useSafeAreaInsets()
  const [os, setOs] = useState<TutorialOS>(Platform.OS === 'android' ? 'android' : 'ios')
  const [stepIndex, setStepIndex] = useState(0)

  const [wasVisible, setWasVisible] = useState(visible)
  if (visible !== wasVisible) {
    setWasVisible(visible)
    if (visible) setStepIndex(0)
  }

  const steps = useMemo(() => buildSteps(os), [os])
  const step = steps[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1
  const showOsToggle = OS_TOGGLE_STEP_KEYS.has(step.key)
  const Illustration = step.Illustration

  function goNext() {
    if (isLastStep) {
      closeTutorial()
      return
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={closeTutorial}
    >
      <View className='flex-1 bg-background'>
        <View
          className='flex-row items-center justify-between border-b border-outline-variant px-4 py-3'
          style={{ paddingTop: insets.top || 12 }}
        >
          <Text className='font-label-sm text-label-sm text-on-surface-variant'>
            {t('tutorial.stepCount', { current: stepIndex + 1, total: steps.length })}
          </Text>
          <Pressable
            {...pressableNoRipple}
            onPress={closeTutorial}
            accessibilityRole='button'
            accessibilityLabel={t('tutorial.close')}
            hitSlop={8}
            className='h-9 w-9 items-center justify-center rounded-full'
          >
            <MaterialIcons name='close' size={22} color='#44474d' />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName='flex-grow items-center justify-center gap-6 px-6 py-8'>
          {showOsToggle ? (
            <View className='flex-row gap-2'>
              <FilterPill label={t('tutorial.osIos')} selected={os === 'ios'} onPress={() => setOs('ios')} />
              <FilterPill label={t('tutorial.osAndroid')} selected={os === 'android'} onPress={() => setOs('android')} />
            </View>
          ) : null}

          <View accessibilityRole='image' accessibilityLabel={t(step.titleKey)}>
            <Illustration />
          </View>

          <View className='max-w-sm gap-2'>
            <Text className='text-center font-headline-md text-headline-md text-primary'>
              {t(step.titleKey)}
            </Text>
            <Text className='text-center font-body-md text-body-md text-on-surface-variant'>
              {t(step.bodyKey, step.bodyParams)}
            </Text>
          </View>
        </ScrollView>

        <View
          className='flex-row items-center justify-between gap-4 border-t border-outline-variant px-6 py-4'
          style={{ paddingBottom: insets.bottom || 16 }}
        >
          <View className='flex-row gap-1.5'>
            {steps.map((s, i) => (
              <View
                key={s.key}
                className={`h-2 rounded-full ${i === stepIndex ? 'w-5 bg-primary' : 'w-2 bg-outline-variant'}`}
              />
            ))}
          </View>
          <View className='flex-row gap-3'>
            {!isFirstStep ? (
              <Button variant='secondary' label={t('common.back')} onPress={goBack} />
            ) : null}
            <Button label={isLastStep ? t('tutorial.done') : t('tutorial.next')} onPress={goNext} />
          </View>
        </View>
      </View>
    </Modal>
  )
}
