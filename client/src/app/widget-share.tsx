import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, Share, View } from 'react-native'

import { useAuth } from '@/contexts/auth-context'
import {
  HOME_WIDGET_SNAPSHOT_KEY,
  type HomeWidgetSnapshot,
} from '@/widgets/types'

function buildShareMessage(snapshot: HomeWidgetSnapshot): string | null {
  const text = snapshot.citationText.trim()
  if (!text) return null
  const source = snapshot.citationSource.trim()
  return source ? `${text}\n\n— ${source}` : text
}

/**
 * Opened from the home-screen widget share action.
 * Android widgets cannot present a share sheet themselves, so this route
 * briefly comes to the foreground, shares, then leaves.
 */
export default function WidgetShareScreen() {
  const router = useRouter()
  const { user, isGuest, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    let cancelled = false

    async function run() {
      let message: string | null = null
      try {
        const raw = await AsyncStorage.getItem(HOME_WIDGET_SNAPSHOT_KEY)
        if (raw) {
          message = buildShareMessage(JSON.parse(raw) as HomeWidgetSnapshot)
        }
      } catch {
        message = null
      }

      if (!cancelled && message) {
        try {
          await Share.share({ message })
        } catch {
          // User dismissed or share unavailable.
        }
      }

      if (cancelled) return
      if (user || isGuest) {
        router.replace('/(tabs)')
      } else {
        router.replace('/auth/login')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [isLoading, user, isGuest, router])

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
