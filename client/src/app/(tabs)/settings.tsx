import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'

import {
  CitationShareCard,
  CITATION_SHARE_CARD_HEIGHT,
  CITATION_SHARE_CARD_WIDTH,
} from '@/components/citation-share-card'
import { Button } from '@/components/ui/button'
import { RadioListRow } from '@/components/ui/radio-list-row'
import { RadioOptionCard } from '@/components/ui/radio-option-card'
import { RangeSlider } from '@/components/ui/range-slider'
import { SelectField } from '@/components/ui/select-field'
import { SettingsSection } from '@/components/ui/settings-section'
import { ToggleRow } from '@/components/ui/toggle-row'
import { TopAppBar } from '@/components/ui/top-app-bar'
import { WidgetPreview } from '@/components/widget-preview'
import { pressableNoRipple } from '@/constants/pressable'
import {
  DEFAULT_WIDGET_DESIGN,
  designUsesRandomBackground,
  getWidgetDesign,
  normalizeWidgetDesignId,
  pickBackgroundImageIndex,
  shiftWidgetDesign,
  WIDGET_DESIGN_IDS,
} from '@/constants/widget-designs'
import { DEFAULT_QUOTE_FONT_SIZE, FONT_SIZE_MAX, FONT_SIZE_MIN } from '@/constants/widget-layout'
import { useAuth } from '@/contexts/auth-context'
import {
  DEFAULT_WIDGET_FONT,
  ensureWidgetFontLoaded,
  WIDGET_FONT_OPTIONS,
} from '@/fonts/registry'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { t } from '@/i18n'
import {
  fetchWidgetCitation,
  previewWidgetCitation,
  saveCitation,
} from '@/services/api'
import { pickGuestWidgetCitation } from '@/services/guest-citation-picker'
import {
  getCachedWidgetCitation,
  getGuestWidgetSettings,
  saveGuestSavedCitation,
  saveGuestWidgetSettings,
  setCachedWidgetCitation,
} from '@/services/local-storage'
import { syncHomeWidget } from '@/services/home-widget-sync'
import { shareCitationCard } from '@/services/share-citation-card'
import {
  getWidgetSettings,
  saveWidgetSettings,
} from '@/services/widget-settings'
import type {
  RefreshRateHours,
  SourceSelection,
  WidgetCitation,
  WidgetSettingsDraft,
} from '@/types/citation'

const SOURCE_OPTIONS: {
  value: SourceSelection
  labelKey:
    | 'settings.poolBible'
    | 'settings.poolFiction'
    | 'settings.poolMixed'
    | 'settings.poolSaved'
  icon: 'church' | 'auto-stories' | 'all-inclusive' | 'bookmark'
}[] = [
  { value: 'bible', labelKey: 'settings.poolBible', icon: 'church' },
  { value: 'fiction', labelKey: 'settings.poolFiction', icon: 'auto-stories' },
  { value: 'mixed', labelKey: 'settings.poolMixed', icon: 'all-inclusive' },
  { value: 'saved', labelKey: 'settings.poolSaved', icon: 'bookmark' },
]

const REFRESH_OPTIONS: {
  value: RefreshRateHours
  labelKey: 'settings.refresh6' | 'settings.refresh12' | 'settings.refresh24'
}[] = [
  { value: 6, labelKey: 'settings.refresh6' },
  { value: 12, labelKey: 'settings.refresh12' },
  { value: 24, labelKey: 'settings.refresh24' },
]

const FONT_OPTIONS = WIDGET_FONT_OPTIONS.map((font) => ({
  value: font.id,
  label: font.label,
  fontFamily: font.family,
}))

const DEFAULT_DRAFT: WidgetSettingsDraft = {
  sourceSelection: 'bible',
  refreshRateHours: 24,
  fontStyle: DEFAULT_WIDGET_FONT,
  fontSize: DEFAULT_QUOTE_FONT_SIZE,
  widgetDesign: DEFAULT_WIDGET_DESIGN,
  showAttribution: true,
  showActions: true,
}

export default function SettingsScreen() {
  const { isGuest } = useAuth()
  const { isLg } = useBreakpoint()
  const [saved, setSaved] = useState<WidgetSettingsDraft | null>(null)
  const [draft, setDraft] = useState<WidgetSettingsDraft>(DEFAULT_DRAFT)
  const [preview, setPreview] = useState<WidgetCitation | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const isFirstSourceRender = useRef(true)
  const suppressNextSourceEffect = useRef(false)
  const draftRef = useRef(draft)
  const shareCardRef = useRef<View>(null)
  const shareLogoReadyRef = useRef(false)
  draftRef.current = draft

  const loadWidgetCitation = useCallback(
    async (
      source: SourceSelection,
      refreshRateHours: RefreshRateHours,
      forceFresh = false,
    ) => {
      console.log('[widget-citation] loadWidgetCitation start', {
        source,
        refreshRateHours,
        forceFresh,
        isGuest,
      })
      setPreviewLoading(true)
      try {
        if (!forceFresh) {
          const cached = await getCachedWidgetCitation()
          if (cached && cached.sourceSelection === source) {
            const rotationMs = refreshRateHours * 60 * 60 * 1000
            const ageMs = Date.now() - cached.fetchedAt
            // Never treat a null citation as a warm cache hit — that freezes an empty
            // preview for the whole refresh window (e.g. after an empty/unseeded pool).
            if (cached.citation && ageMs < rotationMs) {
              console.log('[widget-citation] using cache', {
                ageMs,
                rotationMs,
                citationId: cached.citation.id,
                textPreview: cached.citation.text?.slice(0, 80) ?? null,
              })
              setPreview(cached.citation)
              return
            }
            console.log('[widget-citation] cache skipped', {
              ageMs,
              rotationMs,
              hasCitation: Boolean(cached.citation),
            })
          } else {
            console.log('[widget-citation] cache miss', {
              hasCached: Boolean(cached),
              cachedSource: cached?.sourceSelection ?? null,
            })
          }
        }

        const result = isGuest
          ? await pickGuestWidgetCitation(source, draftRef.current.widgetDesign)
          : await fetchWidgetCitation(forceFresh)
        console.log('[widget-citation] fetch result', {
          path: isGuest ? 'guest' : 'auth',
          citationId: result.citation?.id ?? null,
          reason: result.reason ?? null,
          textPreview: result.citation?.text?.slice(0, 80) ?? null,
        })
        setPreview(result.citation)
        await setCachedWidgetCitation({
          citation: result.citation,
          fetchedAt: Date.now(),
          sourceSelection: source,
        })
      } catch (error) {
        console.warn('[widget-citation] loadWidgetCitation failed', error)
        setPreview(null)
      } finally {
        setPreviewLoading(false)
      }
    },
    [isGuest],
  )

  /**
   * Shows what a different (not-yet-saved) source pool would look like without touching
   * the real widget's committed state — unlike `loadWidgetCitation(force=true)`, this never
   * persists a new "current citation" server-side or into the shared cache.
   */
  const previewDraftPool = useCallback(
    async (source: SourceSelection) => {
      console.log('[widget-citation] previewDraftPool start', {
        source,
        isGuest,
        fontStyle: draft.fontStyle,
      })
      setPreviewLoading(true)
      try {
        const result = isGuest
          ? await pickGuestWidgetCitation(source, draft.widgetDesign)
          : await previewWidgetCitation({
              sourceSelection: source,
              fontStyle: draft.fontStyle,
              widgetDesign: draft.widgetDesign,
              showAttribution: draft.showAttribution,
            })
        console.log('[widget-citation] previewDraftPool result', {
          path: isGuest ? 'guest' : 'auth-preview',
          citationId: result.citation?.id ?? null,
          reason: result.reason ?? null,
          textPreview: result.citation?.text?.slice(0, 80) ?? null,
        })
        setPreview(result.citation)
      } catch (error) {
        console.warn('[widget-citation] previewDraftPool failed', error)
        setPreview(null)
      } finally {
        setPreviewLoading(false)
      }
    },
    [isGuest, draft.fontStyle, draft.widgetDesign, draft.showAttribution],
  )

  const loadSettings = useCallback(async () => {
    console.log('[widget-citation] loadSettings start', { isGuest })
    const settings = isGuest
      ? await getGuestWidgetSettings()
      : await getWidgetSettings()
    const next: WidgetSettingsDraft = {
      sourceSelection: settings.sourceSelection,
      refreshRateHours: settings.refreshRateHours,
      fontStyle: settings.fontStyle,
      fontSize: settings.fontSize,
      widgetDesign: normalizeWidgetDesignId(settings.widgetDesign),
      showAttribution: settings.showAttribution,
      showActions: settings.showActions,
    }
    console.log('[widget-citation] settings loaded', {
      sourceSelection: next.sourceSelection,
      refreshRateHours: next.refreshRateHours,
      fontStyle: next.fontStyle,
      widgetDesign: next.widgetDesign,
    })
    setSaved(next)
    setDraft(next)
    isFirstSourceRender.current = true
    // The default state always mirrors today's real widget citation — never rolls a new one.
    await loadWidgetCitation(next.sourceSelection, next.refreshRateHours)
    const cached = await getCachedWidgetCitation()
    console.log('[widget-citation] syncHomeWidget after load', {
      cachedCitationId: cached?.citation?.id ?? null,
    })
    await syncHomeWidget(next, cached?.citation ?? null).catch((error) => {
      console.warn('[widget-citation] syncHomeWidget failed', error)
    })
  }, [isGuest, loadWidgetCitation])

  useEffect(() => {
    loadSettings().catch((error) => {
      console.warn('[widget-citation] loadSettings failed', error)
    })
  }, [loadSettings])

  useEffect(() => {
    // Load the selected face (and default) on demand — not every widget font at once.
    void ensureWidgetFontLoaded(draft.fontStyle)
    if (draft.fontStyle !== DEFAULT_WIDGET_FONT) {
      void ensureWidgetFontLoaded(DEFAULT_WIDGET_FONT)
    }
  }, [draft.fontStyle])

  useEffect(() => {
    if (isFirstSourceRender.current) {
      isFirstSourceRender.current = false
      return
    }
    if (suppressNextSourceEffect.current) {
      suppressNextSourceEffect.current = false
      return
    }
    previewDraftPool(draft.sourceSelection).catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.sourceSelection])

  // Sanctuary needs a display-only random index for the current preview — not citation-owned.
  useEffect(() => {
    if (!designUsesRandomBackground(draft.widgetDesign)) return
    setPreview((prev) => {
      if (!prev || prev.backgroundImageIndex !== undefined) return prev
      return { ...prev, backgroundImageIndex: pickBackgroundImageIndex() }
    })
  }, [draft.widgetDesign, preview?.id])

  useEffect(() => {
    shareLogoReadyRef.current = false
  }, [preview?.id])

  function updateDraft<K extends keyof WidgetSettingsDraft>(
    key: K,
    value: WidgetSettingsDraft[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const shiftDesign = useCallback((delta: number) => {
    setDraft((prev) => ({
      ...prev,
      widgetDesign: shiftWidgetDesign(prev.widgetDesign, delta),
    }))
  }, [])

  const shiftDesignRef = useRef(shiftDesign)
  shiftDesignRef.current = shiftDesign

  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25,
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx <= -40) shiftDesignRef.current(1)
        else if (gesture.dx >= 40) shiftDesignRef.current(-1)
      },
    }),
  ).current

  async function handleSave() {
    setSaving(true)
    try {
      const updated = isGuest
        ? await saveGuestWidgetSettings(draft).then(() => draft)
        : await saveWidgetSettings(draft)
      const next: WidgetSettingsDraft = {
        sourceSelection: updated.sourceSelection,
        refreshRateHours: updated.refreshRateHours,
        fontStyle: updated.fontStyle,
        fontSize: updated.fontSize,
        widgetDesign: normalizeWidgetDesignId(updated.widgetDesign),
        showAttribution: updated.showAttribution,
        showActions: updated.showActions,
      }
      const poolChanged = saved?.sourceSelection !== next.sourceSelection
      suppressNextSourceEffect.current = true
      setSaved(next)
      setDraft(next)
      // Re-anchor on a real, committed citation for the saved pool — while editing, the
      // preview may have only shown an ephemeral, non-committing pool preview pick.
      await loadWidgetCitation(next.sourceSelection, next.refreshRateHours, poolChanged)
      const cached = await getCachedWidgetCitation()
      await syncHomeWidget(next, cached?.citation ?? null).catch(() => undefined)
      Alert.alert(t('common.save'), t('settings.saved'))
    } catch (e) {
      Alert.alert(
        t('common.error'),
        e instanceof Error ? e.message : t('settings.saveFailed'),
      )
    } finally {
      setSaving(false)
    }
  }

  function handleDiscard() {
    if (!saved) return
    suppressNextSourceEffect.current = true
    setDraft(saved)
    loadWidgetCitation(saved.sourceSelection, saved.refreshRateHours).catch(() => undefined)
  }

  function handleRefreshWidget() {
    loadWidgetCitation(
      draft.sourceSelection,
      draft.refreshRateHours,
      true,
    )
      .then(async () => {
        const cached = await getCachedWidgetCitation()
        await syncHomeWidget(draft, cached?.citation ?? preview).catch(
          () => undefined,
        )
      })
      .catch(() => undefined)
  }

  async function handleSaveWidgetCitation() {
    if (!preview) return
    try {
      if (isGuest) {
        await saveGuestSavedCitation({
          id: preview.id,
          text: preview.text,
          source: preview.source,
          category: preview.category,
        })
      } else {
        await saveCitation(preview.id)
      }
      Alert.alert(t('common.save'), t('settings.actionSaveSuccess'))
    } catch (e) {
      Alert.alert(
        t('common.error'),
        e instanceof Error ? e.message : t('settings.actionSaveFailed'),
      )
    }
  }

  async function handleShareWidgetCitation() {
    if (!preview) return
    try {
      // Give the off-screen card a frame (and logo decode) before capturing.
      if (!shareLogoReadyRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 120))
      }
      const message = preview.source
        ? `${preview.text}\n\n— ${preview.source}`
        : preview.text
      await shareCitationCard({ viewRef: shareCardRef, message })
    } catch {
      Alert.alert(t('common.error'), t('settings.shareFailed'))
    }
  }

  const settingsColumn = (
    <View className='gap-8'>
      <SettingsSection title={t('settings.sourcePool')} icon='menu-book'>
        <View className='flex-row flex-wrap gap-4'>
          {SOURCE_OPTIONS.map((option) => (
            <RadioOptionCard
              key={option.value}
              label={t(option.labelKey)}
              icon={option.icon}
              selected={draft.sourceSelection === option.value}
              onPress={() => updateDraft('sourceSelection', option.value)}
            />
          ))}
        </View>
      </SettingsSection>

      <SettingsSection title={t('settings.refreshRate')} icon='update'>
        <View className='gap-3'>
          {REFRESH_OPTIONS.map((option) => (
            <RadioListRow
              key={option.value}
              label={t(option.labelKey)}
              selected={draft.refreshRateHours === option.value}
              onPress={() => updateDraft('refreshRateHours', option.value)}
            />
          ))}
        </View>
      </SettingsSection>

      <SettingsSection title={t('settings.displayOptions')} icon='visibility'>
        <View className='gap-4'>
          <ToggleRow
            title={t('settings.attribution')}
            description={t('settings.attributionDesc')}
            value={draft.showAttribution}
            onValueChange={(v) => updateDraft('showAttribution', v)}
          />
          <ToggleRow
            title={t('settings.showActions')}
            description={t('settings.showActionsDesc')}
            value={draft.showActions}
            onValueChange={(v) => updateDraft('showActions', v)}
          />
        </View>
      </SettingsSection>

      <SettingsSection title={t('settings.typography')} icon='format-size'>
        <View className='gap-6'>
          <SelectField
            options={FONT_OPTIONS}
            value={draft.fontStyle}
            onChange={(v) => updateDraft('fontStyle', v)}
          />
          <View className='gap-2'>
            <View className='flex-row items-center justify-between'>
              <Text className='font-label-sm text-label-sm text-on-surface-variant'>
                {t('settings.fontSize')}
              </Text>
              <Text className='font-label-sm text-label-sm text-primary'>
                {draft.fontSize}
              </Text>
            </View>
            <RangeSlider
              value={draft.fontSize}
              min={FONT_SIZE_MIN}
              max={FONT_SIZE_MAX}
              onChange={(v) => updateDraft('fontSize', v)}
              accessibilityLabel={t('settings.fontSize')}
            />
          </View>
        </View>
      </SettingsSection>
    </View>
  )

  const activeDesign = getWidgetDesign(draft.widgetDesign)
  const designIndex = WIDGET_DESIGN_IDS.indexOf(draft.widgetDesign)

  const previewColumn = (
    <View className='gap-8'>
      <View className='gap-4'>
        <View className='flex-row items-center gap-2'>
          <Pressable
            {...pressableNoRipple}
            onPress={() => shiftDesign(-1)}
            accessibilityRole='button'
            accessibilityLabel={t('settings.designPrev')}
            className='h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface'
          >
            <MaterialIcons name='chevron-left' size={28} color='#021a35' />
          </Pressable>

          <View className='min-w-0 flex-1' {...swipeResponder.panHandlers}>
            <WidgetPreview
              citation={preview}
              fontStyle={draft.fontStyle}
              fontSize={draft.fontSize}
              design={draft.widgetDesign}
              loading={previewLoading}
              showActions={draft.showActions}
              onRefresh={handleRefreshWidget}
              onSave={handleSaveWidgetCitation}
              onShare={handleShareWidgetCitation}
            />
          </View>

          <Pressable
            {...pressableNoRipple}
            onPress={() => shiftDesign(1)}
            accessibilityRole='button'
            accessibilityLabel={t('settings.designNext')}
            className='h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface'
          >
            <MaterialIcons name='chevron-right' size={28} color='#021a35' />
          </Pressable>
        </View>

        <View className='items-center gap-2'>
          <Text className='font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant'>
            {t('settings.designLabel')}
          </Text>
          <Text className='font-headline-md text-headline-md text-primary'>
            {t(activeDesign.labelKey)}
          </Text>
          <View className='flex-row items-center gap-2 pt-1'>
            {WIDGET_DESIGN_IDS.map((id, index) => (
              <Pressable
                key={id}
                {...pressableNoRipple}
                onPress={() => updateDraft('widgetDesign', id)}
                accessibilityRole='button'
                accessibilityLabel={t(getWidgetDesign(id).labelKey)}
                accessibilityState={{ selected: index === designIndex }}
                className={`h-2 rounded-full ${
                  index === designIndex ? 'w-5 bg-primary' : 'w-2 bg-outline-variant'
                }`}
              />
            ))}
          </View>
        </View>
      </View>

      <View className='flex-row flex-wrap justify-end gap-4'>
        <Button
          className='min-w-[14rem] flex-1'
          label={t('common.cancel')}
          variant='secondary'
          secondaryBorder='secondary'
          onPress={handleDiscard}
        />
        <Button
          className='min-w-[14rem] flex-1'
          label={saving ? t('common.saving') : t('common.save')}
          icon='save'
          onPress={handleSave}
          disabled={saving}
        />
      </View>
    </View>
  )

  return (
    <View className='flex-1 bg-background'>
      <TopAppBar title={t('settings.title')} />
      <ScrollView className='flex-1' contentContainerClassName='pb-28 md:pb-12'>
        <View className='mx-auto w-full max-w-[1200px] px-margin-mobile py-8 md:px-margin-desktop md:py-12'>
          {isLg ? (
            <View className='flex-row items-start gap-gutter'>
              <View className='w-7/12'>{settingsColumn}</View>
              <View className='w-5/12'>{previewColumn}</View>
            </View>
          ) : (
            <View className='gap-8'>
              {settingsColumn}
              {previewColumn}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Off-screen social card captured as a PNG when the user taps Share. */}
      {preview ? (
        <View
          pointerEvents='none'
          style={{
            position: 'absolute',
            left: -CITATION_SHARE_CARD_WIDTH - 40,
            top: 0,
            width: CITATION_SHARE_CARD_WIDTH,
            height: CITATION_SHARE_CARD_HEIGHT,
            opacity: 1,
          }}
        >
          <View ref={shareCardRef} collapsable={false}>
            <CitationShareCard
              text={preview.text}
              source={preview.source}
              onLogoLoad={() => {
                shareLogoReadyRef.current = true
              }}
            />
          </View>
        </View>
      ) : null}
    </View>
  )
}
