import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { ActivityIndicator, Share, View } from 'react-native'

import { fetchWidgetCitation, saveCitation, unsaveCitation } from '@/services/api'
import { getAccessToken } from '@/services/auth-storage'
import { buildShareText } from '@/services/build-share-text'
import { pickGuestWidgetCitation } from '@/services/guest-citation-picker'
import {
  getCachedWidgetCitation,
  getGuestWidgetSettings,
  isGuestMode,
  removeGuestSavedCitation,
  saveGuestSavedCitation,
  setCachedWidgetCitation,
} from '@/services/local-storage'
import { syncHomeWidget } from '@/services/home-widget-sync'
import { getWidgetSettings } from '@/services/widget-settings'
import { HOME_WIDGET_SNAPSHOT_KEY, type HomeWidgetSnapshot } from '@/widgets/types'
import type { WidgetActionId } from '@/widgets/widget-action-uri'

async function shouldUseLocalWidgetSettings(): Promise<boolean> {
  if (await isGuestMode()) return true
  return !(await getAccessToken())
}

async function loadSnapshot(): Promise<HomeWidgetSnapshot | null> {
  const raw = await AsyncStorage.getItem(HOME_WIDGET_SNAPSHOT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as HomeWidgetSnapshot
  } catch {
    return null
  }
}

async function persistSnapshot(snapshot: HomeWidgetSnapshot): Promise<void> {
  await AsyncStorage.setItem(HOME_WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot))
}

/** Mirrors Android's `task-handler.tsx` REFRESH — the only path with network access. */
async function runRefresh(): Promise<void> {
  const local = await shouldUseLocalWidgetSettings()
  const settings = local ? await getGuestWidgetSettings() : await getWidgetSettings()
  const result = local
    ? await pickGuestWidgetCitation(settings.sourceSelection, settings.widgetDesign)
    : await fetchWidgetCitation(true)

  await setCachedWidgetCitation({
    citation: result.citation,
    fetchedAt: Date.now(),
    sourceSelection: settings.sourceSelection,
  })
  await syncHomeWidget(settings, result.citation)
}

/** Mirrors Android's TOGGLE_SAVE. */
async function runToggleSave(): Promise<void> {
  const snapshot = await loadSnapshot()
  if (!snapshot?.citationId || !snapshot.citationText || !snapshot.citationCategory) return

  const guest = await isGuestMode()
  if (snapshot.isSaved) {
    if (guest) await removeGuestSavedCitation(snapshot.citationId)
    else await unsaveCitation(snapshot.citationId)
  } else if (guest) {
    await saveGuestSavedCitation({
      id: snapshot.citationId,
      text: snapshot.citationText,
      source: snapshot.citationSource,
      category: snapshot.citationCategory,
    })
  } else {
    await saveCitation(snapshot.citationId)
  }

  await persistSnapshot({ ...snapshot, isSaved: !snapshot.isSaved, fetchedAt: Date.now() })

  const local = await shouldUseLocalWidgetSettings()
  const settings = local ? await getGuestWidgetSettings() : await getWidgetSettings()
  const cached = await getCachedWidgetCitation()
  await syncHomeWidget(settings, cached?.citation ?? null)
}

/** iOS widget extensions can't present the share sheet directly — the app does it instead. */
async function runShare(): Promise<void> {
  const snapshot = await loadSnapshot()
  if (!snapshot) return
  const text = buildShareText(snapshot.citationText, snapshot.citationSource)
  if (text) await Share.share({ message: text })
}

/**
 * Landing route for iOS widget action chips (`citationswidget://widget-action?action=…`).
 * The widget extension has no fetch/native-module access, so refresh/save/share
 * all deep-link here to run with the full app runtime, then bounce back to the tabs.
 */
export default function WidgetActionScreen() {
  const router = useRouter()
  const { action } = useLocalSearchParams<{ action?: WidgetActionId }>()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    void (async () => {
      try {
        if (action === 'refresh') await runRefresh()
        else if (action === 'toggle-save') await runToggleSave()
        else if (action === 'share') await runShare()
      } catch {
        // Best-effort — a failed widget action must never block entering the app.
      } finally {
        router.replace('/(tabs)')
      }
    })()
  }, [action, router])

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#fbf9f8',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator size='large' color='#021a35' />
    </View>
  )
}
