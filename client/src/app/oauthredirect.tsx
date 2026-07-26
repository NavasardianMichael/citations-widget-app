import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

import { useAuth } from '@/contexts/auth-context'

/**
 * Landing route for Google OAuth (`…://oauthredirect`).
 * Prevents Expo Router Unmatched Route while AuthSession completes.
 * Must self-navigate — Login may unmount when this deep link opens.
 */
export default function OAuthRedirectScreen() {
  const router = useRouter()
  const { user, isLoading, refreshSession, completeGuestSignIn } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (user) {
      router.replace('/(tabs)')
      return
    }

    let cancelled = false

    async function finishAuth() {
      // Let Login's in-flight promptAsync + setUser finish first when still alive.
      await new Promise((resolve) => setTimeout(resolve, 700))
      if (cancelled) return

      // Tokens may already be stored even if Login unmounted before setUser.
      const recovered = await refreshSession()
      if (cancelled) return
      if (recovered) {
        await completeGuestSignIn()
        router.replace('/(tabs)')
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 1200))
      if (cancelled) return
      router.replace('/auth/login')
    }

    void finishAuth()
    return () => {
      cancelled = true
    }
  }, [user, isLoading, router, refreshSession, completeGuestSignIn])

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
