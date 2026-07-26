import { useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native'

import {
  CitationCard,
  type CitationCardVariant,
} from '@/components/citation-card'
import {
  CitationForm,
  citationToFormValues,
  type CitationFormValues,
} from '@/components/citation-form'
import { SubmissionCard } from '@/components/submission-card'
import { Button } from '@/components/ui/button'
import { FilterPill } from '@/components/ui/filter-pill'
import { TopAppBar } from '@/components/ui/top-app-bar'
import { DEFAULT_QUOTE_FONT_SIZE } from '@/constants/widget-layout'
import { useAuth } from '@/contexts/auth-context'
import { DEFAULT_WIDGET_FONT } from '@/fonts/registry'
import { t } from '@/i18n'
import {
  hasErrors,
  validateCitationForm,
  validateCitationTextMax,
  type FieldErrors,
} from '@/lib/validation'
import {
  deleteCitation,
  fetchMyCitations,
  fetchSavedCitations,
  getWidgetSettings,
  unsaveCitation,
  updateCitation,
} from '@/services/api'
import {
  getGuestSavedCitations,
  getGuestWidgetSettings,
  removeGuestSavedCitation,
} from '@/services/local-storage'
import type {
  Citation,
  FontStyle,
  OwnedCitation,
} from '@/types/citation'

type LibraryFilter =
  | 'all'
  | 'saved'
  | 'pending'
  | 'approved'
  | 'private'

type LibraryItem = {
  citation: Citation
  isSaved: boolean
  owned: OwnedCitation | null
}

const VARIANT_CYCLE: CitationCardVariant[] = [
  'decorative',
  'minimalist',
  'featured',
  'decorative',
  'minimalist',
]

const GUEST_FILTERS: { value: LibraryFilter; labelKey: 'citations.filterAll' | 'citations.filterSaved' }[] = [
  { value: 'all', labelKey: 'citations.filterAll' },
  { value: 'saved', labelKey: 'citations.filterSaved' },
]

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
  { value: 'pending', labelKey: 'citations.filterPending' },
  { value: 'approved', labelKey: 'citations.filterApproved' },
  { value: 'private', labelKey: 'citations.filterPrivate' },
]

function mergeLibrary(
  saved: Citation[],
  mine: OwnedCitation[],
): LibraryItem[] {
  const byId = new Map<string, LibraryItem>()
  const savedIds = new Set(saved.map((c) => c.id))

  for (const owned of mine) {
    // Rejected citations are deleted from the DB after manual email notice — never list them.
    if (owned.status === 'rejected') continue
    byId.set(owned.id, {
      citation: owned,
      isSaved: savedIds.has(owned.id) || owned.status === 'private',
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
      return item.isSaved
    case 'pending':
    case 'approved':
    case 'private':
      return item.owned?.status === filter
    default:
      return true
  }
}

export default function CitationsScreen() {
  const { user, isGuest } = useAuth()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [filter, setFilter] = useState<LibraryFilter>('all')
  const [fontStyle, setFontStyle] = useState<FontStyle>(DEFAULT_WIDGET_FONT)
  const [fontSize, setFontSize] = useState(DEFAULT_QUOTE_FONT_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<CitationFormValues | null>(null)
  const [editErrors, setEditErrors] = useState<FieldErrors<'text' | 'source'>>({})
  const [savingEdit, setSavingEdit] = useState(false)

  const filterOptions = isGuest || !user ? GUEST_FILTERS : SIGNED_IN_FILTERS

  const loadLibrary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (isGuest || !user) {
        const [saved, settings] = await Promise.all([
          getGuestSavedCitations(),
          getGuestWidgetSettings(),
        ])
        setItems(mergeLibrary(saved, []))
        setFontStyle(settings.fontStyle)
        setFontSize(settings.fontSize)
        return
      }

      const [saved, mine, settings] = await Promise.all([
        fetchSavedCitations(),
        fetchMyCitations('all'),
        getWidgetSettings(),
      ])
      setItems(mergeLibrary(saved, mine))
      setFontStyle(settings.fontStyle)
      setFontSize(settings.fontSize)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('citations.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [isGuest, user])

  useFocusEffect(
    useCallback(() => {
      loadLibrary()
    }, [loadLibrary]),
  )

  const filteredItems = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [items, filter],
  )

  async function handleUnsave(id: string) {
    if (isGuest || !user) {
      await removeGuestSavedCitation(id)
    } else {
      await unsaveCitation(id)
    }
    // Reload so private deletes and bookmark removals stay consistent with the server.
    await loadLibrary()
  }

  function confirmUnsave(id: string) {
    Alert.alert(t('card.removeSavedConfirmTitle'), t('card.removeSavedConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('card.remove'),
        style: 'destructive',
        onPress: () => {
          void handleUnsave(id)
        },
      },
    ])
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
            if (editingId === id) cancelEdit()
            // Refetch so a failed/partial delete cannot leave a stale row after navigation.
            await loadLibrary()
          } catch (e) {
            Alert.alert(
              t('common.error'),
              e instanceof Error ? e.message : t('citations.loadFailed'),
            )
            await loadLibrary()
          }
        },
      },
    ])
  }

  function startEdit(citation: OwnedCitation) {
    setEditingId(citation.id)
    setEditValues(citationToFormValues(citation))
    setEditErrors({})
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues(null)
    setEditErrors({})
  }

  async function handleSaveEdit(id: string) {
    if (!editValues) return
    const nextErrors = validateCitationForm(editValues)
    setEditErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSavingEdit(true)
    try {
      const updated = await updateCitation(id, {
        text: editValues.text.trim(),
        source: editValues.source.trim(),
        category: editValues.category,
      })
      setItems((prev) =>
        prev.map((item) =>
          item.citation.id === id
            ? {
                citation: updated,
                isSaved: item.isSaved || updated.status === 'private',
                owned: updated,
              }
            : item,
        ),
      )
      cancelEdit()
      Alert.alert(
        t('common.save'),
        updated.status === 'pending'
          ? t('submit.citationPendingReview')
          : t('submit.citationUpdated'),
      )
    } catch (e) {
      Alert.alert(
        t('common.error'),
        e instanceof Error ? e.message : t('submit.updateCitationFailed'),
      )
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <View className='flex-1 bg-background'>
      <TopAppBar title={t('citations.title')} showBrandIcon />
      <ScrollView className='flex-1' contentContainerClassName='pb-28 md:pb-12'>
        <View className='mx-auto w-full max-w-[1200px] gap-8 px-margin-mobile pt-8 md:px-margin-desktop md:pt-12'>
          <View className='flex-row flex-wrap gap-2'>
            {filterOptions.map((option) => (
              <FilterPill
                key={option.value}
                label={t(option.labelKey)}
                selected={filter === option.value}
                onPress={() => setFilter(option.value)}
              />
            ))}
          </View>

          {loading ? (
            <ActivityIndicator size='large' color='#021a35' className='py-12' />
          ) : error ? (
            <Text className='text-center text-error'>{error}</Text>
          ) : filteredItems.length === 0 ? (
            <View className='items-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-12'>
              <Text className='text-center font-headline-md text-headline-md text-primary'>
                {t('citations.emptyTitle')}
              </Text>
              <Text className='text-center font-body-md text-body-md text-on-surface-variant'>
                {t('citations.emptyBody')}
              </Text>
            </View>
          ) : (
            <View className='flex-row flex-wrap gap-gutter'>
              {filteredItems.map((item, index) => {
                const { citation, owned, isSaved } = item

                if (owned && editingId === owned.id && editValues) {
                  return (
                    <View key={citation.id} className='w-full'>
                      <CitationForm
                        values={editValues}
                        onChange={(next) => {
                          setEditValues(next)
                          setEditErrors((prev) => {
                            const updated = { ...prev }
                            if (next.text !== editValues.text) {
                              const maxError = validateCitationTextMax(next.text)
                              if (maxError) updated.text = maxError
                              else delete updated.text
                            }
                            if (next.source !== editValues.source) delete updated.source
                            return updated
                          })
                        }}
                        errors={editErrors}
                        disabled={savingEdit}
                        footer={
                          <View className='flex-row justify-end gap-3'>
                            <Button
                              label={t('common.cancel')}
                              variant='secondary'
                              onPress={cancelEdit}
                              disabled={savingEdit}
                            />
                            <Button
                              label={savingEdit ? t('common.saving') : t('profile.saveChanges')}
                              onPress={() => handleSaveEdit(owned.id)}
                              disabled={savingEdit}
                            />
                          </View>
                        }
                      />
                    </View>
                  )
                }

                if (owned) {
                  return (
                    <View key={citation.id} className='w-full md:w-[calc(50%-12px)]'>
                      <SubmissionCard
                        citation={owned}
                        onEdit={() => startEdit(owned)}
                        onDelete={() => confirmDelete(owned.id)}
                      />
                    </View>
                  )
                }

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
                    fontStyle={fontStyle}
                    fontSize={fontSize}
                    className={spanClass}
                    isSaved={isSaved}
                    onUnsave={isSaved ? () => confirmUnsave(citation.id) : undefined}
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
