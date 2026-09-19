/**
 * `createWidget()` is what writes the serialized layout into the App Group, and
 * the widget extension shows onboarding copy until that happens. Importing this
 * module from the root layout registers the layout on every app launch instead
 * of waiting for the first widget sync to pull `CitationWidget` in.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

import CitationWidget from '@/widgets/CitationWidget'
import { toIosWidgetProps } from '@/widgets/ios-props'
import { HOME_WIDGET_SNAPSHOT_KEY, type HomeWidgetSnapshot } from '@/widgets/types'

/**
 * Replays the last stored snapshot so a widget has something to show while the
 * sync runs.
 *
 * Deliberately leaves the App Group file alone. That file is what the extension
 * actually reads and `home-widget-sync` owns it, whereas this snapshot is the
 * stored one — saved before the sync resolves the font and photo paths. Writing
 * it here replaced a styled file with an unstyled one and raced the sync that
 * had just written it. Breadcrumbs put that sync at well under a second on every
 * launch, so there is nothing left for a second writer to rescue.
 *
 * No `reload()` either: `updateSnapshot` already asks WidgetKit for one, iOS
 * budgets how many it honours, and this module used to spend three of them per
 * launch before any content existed to show.
 */
async function restoreStoredSnapshot(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(HOME_WIDGET_SNAPSHOT_KEY)
    if (!raw) return
    CitationWidget.updateSnapshot(toIosWidgetProps(JSON.parse(raw) as HomeWidgetSnapshot))
  } catch (error) {
    // Also covers the native module being unavailable (e.g. Expo Go), which the
    // widget sync then retries later.
    const { Sentry } = await import('@/lib/sentry')
    Sentry.captureException(error)
  }
}

restoreStoredSnapshot()

export default CitationWidget
