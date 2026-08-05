import { Platform } from 'react-native'

import { ANDROID_WIDGET_NAMES } from '@/widgets/types'

/**
 * Whether any Citation home-screen widget instance is currently placed.
 * Android: queries AppWidgetManager via `getWidgetInfo`.
 * iOS/web: no reliable public query — returns false (treat as not placed).
 */
export async function hasPlacedHomeWidget(): Promise<boolean> {
  if (Platform.OS !== 'android') return false

  try {
    const { getWidgetInfo } = await import('react-native-android-widget')
    const lists = await Promise.all(
      ANDROID_WIDGET_NAMES.map((widgetName) => getWidgetInfo(widgetName)),
    )
    return lists.some((list) => list.length > 0)
  } catch {
    return false
  }
}
