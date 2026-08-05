import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { FilterPill } from '@/components/ui/filter-pill'
import { TopAppBar } from '@/components/ui/top-app-bar'
import { WidgetPreview } from '@/components/widget-preview'
import { pressableNoRipple } from '@/constants/pressable'
import {
  DEFAULT_WIDGET_DESIGN,
  type WidgetDesignId,
} from '@/constants/widget-designs'
import { DEFAULT_QUOTE_FONT_SIZE } from '@/constants/widget-layout'
import { useAuth } from '@/contexts/auth-context'
import { useOnboarding } from '@/contexts/onboarding-context'
import { DEFAULT_WIDGET_FONT } from '@/fonts/registry'
import { t } from '@/i18n'
import { getUserFacingError } from '@/lib/user-facing-error'
import {
  deleteCitation,
  fetchMyCitations,
  fetchSavedCitations,
  getWidgetSettings,
  unsaveCitation,
} from '@/services/api'
import {
  getGuestSavedCitations,
  getGuestWidgetSettings,
  removeGuestSavedCitation,
} from '@/services/local-storage'
import { hasPlacedHomeWidget } from '@/services/home-widget-presence'
import type { Citation, FontStyle, OwnedCitation } from '@/types/citation'

type LibraryFilter = 'all' | 'saved' | 'pending' | 'approved' | 'private'

type LibraryItem = {
  citation: Citation
  isSaved: boolean
  owned: OwnedCitation | null
}

const SIGNED_IN_FILTERS: {
  value: LibraryFilter
  labelKey:
    | 'citations.filterAll'
    | 'citations.filterSaved'
    | 'citations.filterPending'
    | 'citations.filterApproved'
    | 'citations.filterPrivate'
}[] = [
  { value: 'all', labelKey: 'citations.filterAll' },
  { value: 'saved', labelKey: 'citations.filterSaved' },
  { value: 'private', labelKey: 'citations.filterPrivate' },
  { value: 'approved', labelKey: 'citations.filterApproved' },
  { value: 'pending', labelKey: 'citations.filterPending' },
]

function mergeLibrary(saved: Citation[], mine: OwnedCitation[]): LibraryItem[] {
  const byId = new Map<string, LibraryItem>()
  const savedIds = new Set(saved.map((c) => c.id))

  for (const owned of mine) {
    // Rejected citations are deleted from the DB after manual email notice — never list them.
    if (owned.status === 'rejected') continue
    byId.set(owned.id, {
      citation: owned,
      isSaved: savedIds.has(owned.id),
      owned,
    })
  }

  for (const citation of saved) {
    const existing = byId.get(citation.id)
    if (existing) {
      existing.isSaved = true
      continue
    }
    byId.set(citation.id, {
      citation,
      isSaved: true,
      owned: null,
    })
  }

  return [...byId.values()].sort((a, b) => {
    const aAt = a.owned?.updatedAt ?? a.citation.createdAt ?? ''
    const bAt = b.owned?.updatedAt ?? b.citation.createdAt ?? ''
    return bAt.localeCompare(aAt)
  })
}

function matchesFilter(item: LibraryItem, filter: LibraryFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'saved':
      // Bookmarks only — own private/pending submissions belong to their status filters.
      return (
        item.isSaved &&
        item.owned?.status !== 'private' &&
        item.owned?.status !== 'pending'
      )
    case 'pending':
    case 'approved':
    case 'private':
      return item.owned?.status === filter
    default:
      return true
  }
}

type LibraryTypeLabelKey =
  | 'citations.filterSaved'
  | 'citations.filterPending'
  | 'citations.filterApproved'
  | 'citations.filterPrivate'

const LIBRARY_TYPE_BADGE_CLASSES: Record<
  LibraryTypeLabelKey,
  { bg: string; text: string }
> = {
  'citations.filterApproved': {
    bg: 'bg-[#cfe8d3]',
    text: 'text-[#1b5e20]',
  },
  'citations.filterPending': {
    bg: 'bg-secondary-container',
    text: 'text-on-secondary-container',
  },
  'citations.filterPrivate': {
    bg: 'bg-primary-fixed',
    text: 'text-on-primary-fixed',
  },
  'citations.filterSaved': {
    bg: 'bg-surface-container-highest',
    text: 'text-on-surface-variant',
  },
}

/** Filter-pill title for an item — shown above the widget only in the All view. */
function libraryTypeLabelKey(item: LibraryItem): LibraryTypeLabelKey | null {
  if (item.owned) {
    switch (item.owned.status) {
      case 'pending':
        return 'citations.filterPending'
      case 'approved':
        return 'citations.filterApproved'
      case 'private':
        return 'citations.filterPrivate'
      default:
        break
    }
  }
  if (item.isSaved) return 'citations.filterSaved'
  return null
}

export default function CitationsScreen() {
  const { user, isGuest } = useAuth()
  const { openTutorial } = useOnboarding()
  const router = useRouter()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [filter, setFilter] = useState<LibraryFilter>('all')
  const [fontStyle, setFontStyle] = useState<FontStyle>(DEFAULT_WIDGET_FONT)
  const [fontSize, setFontSize] = useState(DEFAULT_QUOTE_FONT_SIZE)
  const [widgetDesign, setWidgetDesign] = useState<WidgetDesignId>(
    DEFAULT_WIDGET_DESIGN,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [widgetPlaced, setWidgetPlaced] = useState(false)

  const isSignedIn = Boolean(user) && !isGuest
  const showTutorialCta = !isSignedIn && !widgetPlaced

  const loadLibrary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (isGuest || !user) {
        const [saved, settings, placed] = await Promise.all([
          getGuestSavedCitations(),
          getGuestWidgetSettings(),
          hasPlacedHomeWidget(),
        ])
        setItems(mergeLibrary(saved, []))
        setFontStyle(settings.fontStyle)
        setFontSize(settings.fontSize)
        setWidgetDesign(settings.widgetDesign)
        setWidgetPlaced(placed)
        return
      }

      const [saved, mine, settings, placed] = await Promise.all([
        fetchSavedCitations(),
        fetchMyCitations('all'),
        getWidgetSettings(),
        hasPlacedHomeWidget(),
      ])
      setItems(mergeLibrary(saved, mine))
      setFontStyle(settings.fontStyle)
      setFontSize(settings.fontSize)
      setWidgetDesign(settings.widgetDesign)
      setWidgetPlaced(placed)
    } catch (e) {
      setError(getUserFacingError(e, 'citations.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [isGuest, user])

  useFocusEffect(
    useCallback(() => {
      loadLibrary()
    }, [loadLibrary]),
  )

  useEffect(() => {
    if (!isSignedIn) setFilter('all')
  }, [isSignedIn])

  const filteredItems = useMemo(
    () =>
      isSignedIn
        ? items.filter((item) => matchesFilter(item, filter))
        : items,
    [items, filter, isSignedIn],
  )

  async function handleUnsave(id: string) {
    if (isGuest || !user) {
      await removeGuestSavedCitation(id)
    } else {
      await unsaveCitation(id)
    }
    await loadLibrary()
  }

  function confirmUnsave(id: string) {
    Alert.alert(
      t('card.removeSavedConfirmTitle'),
      t('card.removeSavedConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('card.remove'),
          style: 'destructive',
          onPress: () => {
            void handleUnsave(id)
          },
        },
      ],
    )
  }

  function confirmDelete(id: string) {
    Alert.alert(t('submit.deleteTitle'), t('submit.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('submit.deleteAction'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCitation(id)
            setItems((prev) => prev.filter((item) => item.citation.id !== id))
            await loadLibrary()
          } catch (e) {
            Alert.alert(
              t('common.error'),
              getUserFacingError(e, 'citations.loadFailed'),
            )
            await loadLibrary()
          }
        },
      },
    ])
  }

  return (
    <View className='flex-1 bg-background'>
      <TopAppBar
        title={t('citations.title')}
        showBrandIcon
        rightAction={
          <Pressable
            {...pressableNoRipple}
            onPress={openTutorial}
            accessibilityRole='button'
            accessibilityLabel={t('tutorial.openButton')}
            hitSlop={8}
            className='h-10 w-10 items-center justify-center rounded-full'
          >
            <MaterialIcons name='help-outline' size={24} color='#44474d' />
          </Pressable>
        }
      />
      <ScrollView className='flex-1' contentContainerClassName='pb-28 md:pb-12'>
        <View className='mx-auto w-full max-w-[1200px] gap-8 px-margin-mobile pt-8 md:px-margin-desktop md:pt-12'>
          {isSignedIn ? (
            <View className='gap-3'>
              <View className='flex-row flex-wrap gap-2'>
                {SIGNED_IN_FILTERS.map((option) => (
                  <FilterPill
                    key={option.value}
                    label={t(option.labelKey)}
                    selected={filter === option.value}
                    onPress={() => setFilter(option.value)}
                  />
                ))}
              </View>
              {filter !== 'all' ? (
                <Text className='font-label-sm text-label-sm text-on-surface-variant'>
                  {t(
                    (
                      {
                        saved: 'citations.filterSavedHint',
                        pending: 'citations.filterPendingHint',
                        approved: 'citations.filterApprovedHint',
                        private: 'citations.filterPrivateHint',
                      } as const
                    )[filter],
                  )}
                </Text>
              ) : null}
            </View>
          ) : null}

          {loading ? (
            <ActivityIndicator size='large' color='#021a35' className='py-12' />
          ) : error ? (
            <ErrorState message={error} onRetry={() => void loadLibrary()} />
          ) : filteredItems.length === 0 ? (
            <View className='gap-8'>
              <View className='items-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-12'>
                <Text className='text-center font-body-md text-body-md text-on-surface-variant'>
                  {t('citations.emptyBody')}
                </Text>
              </View>
              <View className='w-full max-w-md gap-3 self-center'>
                {!isSignedIn ? (
                  <Button
                    label={t('guest.signIn')}
                    onPress={() => router.push('/auth/login')}
                    className='w-full'
                  />
                ) : null}
                {showTutorialCta ? (
                  <Button
                    label={t('citations.openTutorial')}
                    variant='secondary'
                    onPress={openTutorial}
                    className='w-full'
                    labelClassName='text-center'
                  />
                ) : null}
              </View>
            </View>
          ) : (
            <View className='flex-row flex-wrap gap-gutter'>
              {filteredItems.map((item) => {
                const { citation, owned, isSaved } = item
                const typeLabelKey =
                  filter === 'all' ? libraryTypeLabelKey(item) : null
                const showUnsave =
                  isSaved &&
                  owned?.status !== 'private' &&
                  owned?.status !== 'pending'

                const footerActions: {
                  icon: keyof typeof MaterialIcons.glyphMap
                  labelKey:
                    | 'card.removeSaved'
                    | 'card.removePending'
                    | 'card.removePrivate'
                    | 'card.removeApproved'
                  onPress: () => void
                }[] = []

                if (owned?.status === 'pending') {
                  footerActions.push({
                    icon: 'delete',
                    labelKey: 'card.removePending',
                    onPress: () => confirmDelete(owned.id),
                  })
                } else if (owned?.status === 'private') {
                  footerActions.push({
                    icon: 'delete',
                    labelKey: 'card.removePrivate',
                    onPress: () => confirmDelete(owned.id),
                  })
                } else if (owned?.status === 'approved') {
                  footerActions.push({
                    icon: 'delete',
                    labelKey: 'card.removeApproved',
                    onPress: () => confirmDelete(owned.id),
                  })
                }

                if (showUnsave) {
                  footerActions.push({
                    icon: 'bookmark-remove',
                    labelKey: 'card.removeSaved',
                    onPress: () => confirmUnsave(citation.id),
                  })
                }

                return (
                  <View key={citation.id} className='w-full gap-1'>
                    {typeLabelKey ? (
                      <View
                        className={`self-start px-2 py-1 ${LIBRARY_TYPE_BADGE_CLASSES[typeLabelKey].bg} rounded-md`}
                      >
                        <Text
                          className={`font-label-sm text-label-sm ${LIBRARY_TYPE_BADGE_CLASSES[typeLabelKey].text}`}
                        >
                          {t(typeLabelKey)}
                        </Text>
                      </View>
                    ) : null}

                    <WidgetPreview
                      citation={{ ...citation, addedBy: null }}
                      fontStyle={fontStyle}
                      fontSize={fontSize}
                      design={widgetDesign}
                      showActions={false}
                      showLivePreviewLabel={false}
                    />

                    {owned?.moderatorNote ? (
                      <Text className='text-sm text-on-error-container'>
                        {t('common.note')}: {owned.moderatorNote}
                      </Text>
                    ) : null}

                    {footerActions.length > 0 ? (
                      <View className='items-end gap-1'>
                        {footerActions.map((action) => (
                          <Pressable
                            key={action.labelKey}
                            {...pressableNoRipple}
                            onPress={action.onPress}
                            accessibilityRole='button'
                            accessibilityLabel={t(action.labelKey)}
                            className='flex-row items-center justify-end gap-2 self-end rounded-full px-3 py-2'
                          >
                            <MaterialIcons
                              name={action.icon}
                              size={20}
                              color='#44474d'
                            />
                            <Text className='font-label-sm text-label-sm text-on-surface-variant'>
                              {t(action.labelKey)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
