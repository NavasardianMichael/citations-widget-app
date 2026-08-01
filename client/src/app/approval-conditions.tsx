import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter, type Href } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { TopAppBar } from '@/components/ui/top-app-bar'
import { pressableNoRipple } from '@/constants/pressable'
import { t } from '@/i18n'

const REQUIREMENT_KEYS = [
  'approvalConditions.reqExactMatch',
  'approvalConditions.reqValidSource',
  'approvalConditions.reqArmenian',
  'approvalConditions.reqNotDuplicate',
] as const

export default function ApprovalConditionsScreen() {
  const router = useRouter()

  return (
    <View className='flex-1 bg-background'>
      <TopAppBar
        title={t('approvalConditions.title')}
        leftAction={
          <Pressable
            {...pressableNoRipple}
            onPress={() => router.back()}
            accessibilityLabel={t('common.back')}
            hitSlop={8}
            className='h-10 w-10 items-center justify-center'
          >
            <MaterialIcons name='arrow-back' size={24} color='#021a35' />
          </Pressable>
        }
      />
      <ScrollView className='flex-1' contentContainerClassName='pb-28 md:pb-12'>
        <View className='mx-auto w-full max-w-2xl gap-10 px-margin-mobile py-8 md:px-margin-desktop md:py-12'>
          <Text className='font-body-md text-body-md text-on-surface-variant'>
            {t('approvalConditions.intro')}
          </Text>

          <View className='gap-4'>
            <Text className='font-headline-md text-headline-md text-primary'>
              {t('approvalConditions.requirementsHeading')}
            </Text>
            <View className='gap-3'>
              {REQUIREMENT_KEYS.map((key) => (
                <View key={key} className='flex-row gap-3'>
                  <MaterialIcons name='check-circle-outline' size={22} color='#021a35' />
                  <Text className='flex-1 font-body-md text-body-md text-on-surface'>
                    {t(key)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className='gap-4 rounded-lg bg-surface-container-low p-6'>
            <Text className='font-headline-md text-headline-md text-primary'>
              {t('approvalConditions.notesHeading')}
            </Text>
            <Text className='font-body-md text-body-md text-on-surface-variant'>
              {t('approvalConditions.noteEdit')}
            </Text>
            <Text className='font-body-md text-body-md text-on-surface-variant'>
              {t('approvalConditions.noteBeautify')}
            </Text>
          </View>

          <Pressable
            {...pressableNoRipple}
            onPress={() => router.replace('/submit' as Href)}
            accessibilityRole='button'
            className='self-start'
          >
            <Text className='font-body-md text-body-md text-primary underline'>
              {t('approvalConditions.backToSubmit')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}
