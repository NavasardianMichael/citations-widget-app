import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { RadioListRow } from '@/components/ui/radio-list-row'
import { RadioOptionCard } from '@/components/ui/radio-option-card'
import { SelectField } from '@/components/ui/select-field'
import { SettingsSection } from '@/components/ui/settings-section'
import { ToggleRow } from '@/components/ui/toggle-row'
import { TopAppBar } from '@/components/ui/top-app-bar'
import { WidgetPreview } from '@/components/widget-preview'
import { pressableNoRipple } from '@/constants/pressable'
import {
  DEFAULT_WIDGET_DESIGN,
  getWidgetDesign,
  shiftWidgetDesign,
  WIDGET_DESIGN_IDS,
} from '@/constants/widget-designs'
import { useAuth } from '@/contexts/auth-context'
import {
  DEFAULT_WIDGET_FONT,
  ensureWidgetFontLoaded,
  WIDGET_FONT_OPTIONS,
} from '@/fonts/registry'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { t } from '@/i18n'
import { fetchWidgetCitation, saveCitation } from '@/services/api'
import { pickGuestWidgetCitation } from '@/services/guest-citation-picker'
import {
  getCachedWidgetCitation,
  getGuestWidgetSettings,
  saveGuestSavedCitation,
  saveGuestWidgetSettings,
  setCachedWidgetCitation,
} from '@/services/local-storage'
import { syncHomeWidget } from '@/services/home-widget-sync'
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

  const loadWidgetCitation = useCallback(
    async (
      source: SourceSelection,
      refreshRateHours: RefreshRateHours,
      forceFresh = false,
    ) => {
      setPreviewLoading(true)
      try {
        if (!forceFresh) {
          const cached = await getCachedWidgetCitation()
          if (cached && cached.sourceSelection === source) {
            const rotationMs = refreshRateHours * 60 * 60 * 1000
            if (Date.now() - cached.fetchedAt < rotationMs) {
              setPreview(cached.citation)
              return
            }
          }
        }

        const result = isGuest
          ? await pickGuestWidgetCitation(source)
          : await fetchWidgetCitation(forceFresh)
        setPreview(result.citation)
        await setCachedWidgetCitation({
          citation: result.citation,
          fetchedAt: Date.now(),
          sourceSelection: source,
        })
      } catch {
        setPreview(null)
      } finally {
        setPreviewLoading(false)
      }
    },
    [isGuest],
  )

  const loadSettings = useCallback(async () => {
    const settings = isGuest
      ? await getGuestWidgetSettings()
      : await getWidgetSettings()
    const next: WidgetSettingsDraft = {
      sourceSelection: settings.sourceSelection,
      refreshRateHours: settings.refreshRateHours,
      fontStyle: settings.fontStyle,
      widgetDesign: settings.widgetDesign ?? DEFAULT_WIDGET_DESIGN,
      showAttribution: settings.showAttribution,
      showActions: settings.showActions,
    }
    setSaved(next)
    setDraft(next)
    isFirstSourceRender.current = true
    await loadWidgetCitation(next.sourceSelection, next.refreshRateHours)
    const cached = await getCachedWidgetCitation()
    await syncHomeWidget(next, cached?.citation ?? null).catch(() => undefined)
  }, [isGuest, loadWidgetCitation])

  useEffect(() => {
    loadSettings().catch(() => undefined)
  }, [loadSettings])

  useEffect(() => {
    void Promise.all(
      WIDGET_FONT_OPTIONS.map((font) => ensureWidgetFontLoaded(font.id)),
    )
  }, [])

  useEffect(() => {
    if (isFirstSourceRender.current) {
      isFirstSourceRender.current = false
      return
    }
    loadWidgetCitation(
      draft.sourceSelection,
      draft.refreshRateHours,
      true,
    ).catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.sourceSelection])

  function updateDraft<K extends keyof WidgetSettingsDraft>(
    key: K,
    value: WidgetSettingsDraft[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

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
        widgetDesign: updated.widgetDesign ?? DEFAULT_WIDGET_DESIGN,
        showAttribution: updated.showAttribution,
        showActions: updated.showActions,
      }
      setSaved(next)
      setDraft(next)
      await syncHomeWidget(next, preview).catch(() => undefined)
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
    if (saved) setDraft(saved)
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
          author: preview.author,
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
      await Share.share({ message: preview.text })
    } catch {
      // user dismissed the share sheet
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
        <SelectField
          options={FONT_OPTIONS}
          value={draft.fontStyle}
          onChange={(v) => updateDraft('fontStyle', v)}
        />
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
            onPress={() =>
              updateDraft(
                'widgetDesign',
                shiftWidgetDesign(draft.widgetDesign, -1),
              )
            }
            accessibilityRole='button'
            accessibilityLabel={t('settings.designPrev')}
            className='h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface'
          >
            <MaterialIcons name='chevron-left' size={28} color='#021a35' />
          </Pressable>

          <View className='min-w-0 flex-1'>
            <WidgetPreview
              citation={preview}
              fontStyle={draft.fontStyle}
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
            onPress={() =>
              updateDraft(
                'widgetDesign',
                shiftWidgetDesign(draft.widgetDesign, 1),
              )
            }
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
                className={`h-2 rounded-full ${index === designIndex ? 'w-5 bg-primary' : 'w-2 bg-outline-variant'}`}
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
    </View>
  )
}
