/**
 * `createWidget()` is what writes the serialized layout into the App Group, and
 * the widget extension shows onboarding copy until that happens. Importing this
 * module from the root layout registers the layout on every app launch instead
 * of waiting for the first widget sync to pull `CitationWidget` in, and reloads
 * WidgetKit so a widget added before this install renders without waiting for
 * the system's own refresh.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

import CitationWidget from '@/widgets/CitationWidget'
import { withoutNullProps } from '@/widgets/ios-props'
import { HOME_WIDGET_SNAPSHOT_KEY, type HomeWidgetSnapshot } from '@/widgets/types'

try {
  CitationWidget.reload()
} catch (error) {
  // Native module unavailable (e.g. Expo Go); the widget sync retries later.
  import('@/lib/sentry').then(({ Sentry }) => Sentry.captureException(error))
}

/**
 * Puts the last stored snapshot back on the widget as soon as the layout exists.
 *
 * `HomeWidgetBootstrap` only syncs once auth has resolved and a citation has been
 * fetched, so until that finishes — or if anything in it stalls, which reports
 * nothing because a pending promise never throws — the extension holds a layout
 * with no props and WidgetKit draws the empty panel. Android never had this gap:
 * its task handler rebuilds from this same key on every widget update.
 *
 * Deliberately independent of `home-widget-sync`: one `AsyncStorage` read and a
 * synchronous native call, so a stall further up the sync chain cannot take the
 * widget's content down with it.
 */
async function restoreStoredSnapshot(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(HOME_WIDGET_SNAPSHOT_KEY)
    if (!raw) return
    CitationWidget.updateSnapshot(withoutNullProps(JSON.parse(raw) as HomeWidgetSnapshot))
  } catch (error) {
    const { Sentry } = await import('@/lib/sentry')
    Sentry.captureException(error)
  }
}

restoreStoredSnapshot()

export default CitationWidget
