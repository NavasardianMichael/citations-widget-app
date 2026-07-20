import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

import {
  CitationCard,
  type CitationCardVariant,
} from '@/components/citation-card'
import { TopAppBar } from '@/components/ui/top-app-bar'
import { useAuth } from '@/contexts/auth-context'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { t } from '@/i18n'
import { fetchSavedCitations, unsaveCitation } from '@/services/api'
import {
  getGuestSavedCitations,
  removeGuestSavedCitation,
} from '@/services/local-storage'
import type { Citation } from '@/types/citation'

const VARIANT_CYCLE: CitationCardVariant[] = [
  'decorative',
  'minimalist',
  'featured',
  'decorative',
  'minimalist',
]

export default function SavedScreen() {
  const { isGuest } = useAuth()
  const { isMd } = useBreakpoint()
  const [citations, setCitations] = useState<Citation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSaved = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = isGuest
        ? await getGuestSavedCitations()
        : await fetchSavedCitations()
      setCitations(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('saved.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [isGuest])

  useFocusEffect(
    useCallback(() => {
      loadSaved()
    }, [loadSaved]),
  )

  async function handleUnsave(id: string) {
    if (isGuest) {
      await removeGuestSavedCitation(id)
    } else {
      await unsaveCitation(id)
    }
    setCitations((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <View className='flex-1 bg-background'>
      <TopAppBar title={t('saved.title')} showBrandIcon />
      <ScrollView className='flex-1' contentContainerClassName='pb-28 md:pb-12'>
        <View className='mx-auto w-full max-w-[1200px] gap-12 px-margin-mobile pt-8 md:px-margin-desktop md:pt-12'>
          <Text
            className={`max-w-2xl font-body-lg text-body-lg text-on-surface-variant text-center font-bold`}
          >
            {t('saved.subtitle')}
          </Text>

          {loading ? (
            <ActivityIndicator size='large' color='#021a35' className='py-12' />
          ) : error ? (
            <Text className='text-center text-error'>{error}</Text>
          ) : citations.length === 0 ? (
            <View className='items-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-12'>
              <Text className='text-center font-headline-md text-headline-md text-primary'>
                {t('saved.emptyTitle')}
              </Text>
              <Text className='text-center font-body-md text-body-md text-on-surface-variant'>
                {t('saved.emptyBody')}
              </Text>
            </View>
          ) : (
            <View className='flex-row flex-wrap gap-gutter'>
              {citations.map((citation, index) => {
                const variant = VARIANT_CYCLE[index % VARIANT_CYCLE.length]
                const spanClass =
                  variant === 'featured'
                    ? 'w-full'
                    : variant === 'minimalist'
                      ? 'w-full md:w-4/12'
                      : 'w-full md:w-8/12'
                return (
                  <CitationCard
                    key={citation.id}
                    citation={citation}
                    variant={variant}
                    className={spanClass}
                    onUnsave={() => handleUnsave(citation.id)}
                  />
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
