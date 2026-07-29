import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

import { useAuth } from '@/contexts/auth-context'
import { isGoogleSignInPending } from '@/services/google-auth'
import { getRefreshToken } from '@/services/auth-storage'

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

    let cancelled = false

    if (user) {
      // Finish guest→account migration before landing on citations; racing
      // parallel WidgetSettings creates used to 500 the library load.
      void (async () => {
        try {
          await completeGuestSignIn()
        } catch {
          // Migration is best-effort; still enter the app.
        }
        if (!cancelled) router.replace('/(tabs)')
      })()
      return () => {
        cancelled = true
      }
    }

    async function finishAuth() {
      // Poll while Login's in-flight promptAsync + code exchange + setTokens run.
      // Native Google returns a code; exchange + /api/auth/google/mobile can take a few seconds.
      const deadline = Date.now() + 12_000
      while (!cancelled && Date.now() < deadline) {
        const refreshToken = await getRefreshToken()
        if (refreshToken) {
          const recovered = await refreshSession()
          if (cancelled) return
          if (recovered) {
            await completeGuestSignIn()
            router.replace('/(tabs)')
            return
          }
        }

        // Still exchanging / calling the API — keep waiting.
        if (isGoogleSignInPending()) {
          await new Promise((resolve) => setTimeout(resolve, 300))
          continue
        }

        // Brief grace period after pending clears (setUser may still be mid-flight).
        await new Promise((resolve) => setTimeout(resolve, 400))
        if (cancelled) return

        const lateToken = await getRefreshToken()
        if (lateToken) {
          const recovered = await refreshSession()
          if (cancelled) return
          if (recovered) {
            await completeGuestSignIn()
            router.replace('/(tabs)')
            return
          }
        }

        break
      }

      if (cancelled) return
      router.replace('/auth/login')
    }

    void finishAuth()
    return () => {
      cancelled = true
    }
    // `user` is read inside the effect for early exit; re-run when it appears.
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
