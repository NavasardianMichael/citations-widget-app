import { useFonts } from 'expo-font'
import {
  DefaultTheme,
  Stack,
  ThemeProvider,
  usePathname,
  useRouter,
  useSegments,
} from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import '../global.css'

import { AnimatedSplashOverlay } from '@/components/animated-icon'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { APP_FONT_SOURCES } from '@/fonts/registry'
import { initSentry, Sentry } from '@/lib/sentry'

initSentry()

SplashScreen.preventAutoHideAsync()

function useProtectedRoute() {
  const { user, isGuest, isLoading, pendingAuthRoute, consumePendingAuthRoute } = useAuth()
  const segments = useSegments()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === 'auth'
    // OAuth callback must not be redirected away while AuthSession completes.
    if (pathname.includes('oauthredirect')) return

    // Guests may open auth screens to sign in later; only signed-in users are kept out of /auth.
    if (!user && !isGuest && !inAuthGroup) {
      // Prefer post-logout / account-deleted landing over a hard jump to login.
      router.replace(consumePendingAuthRoute() ?? '/auth/login')
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)')
    } else if (!user && inAuthGroup && pendingAuthRoute) {
      consumePendingAuthRoute()
    }
  }, [
    user,
    isGuest,
    isLoading,
    segments,
    pathname,
    router,
    pendingAuthRoute,
    consumePendingAuthRoute,
  ])
}

function RootNavigator() {
  const { isLoading } = useAuth()
  useProtectedRoute()

  if (isLoading) return null

  return (
    <>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name='(tabs)' />
        <Stack.Screen name='auth' />
        <Stack.Screen name='oauthredirect' options={{ headerShown: false }} />
      </Stack>
    </>
  )
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(APP_FONT_SOURCES)

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <AuthProvider>
          <View style={{ flex: 1, backgroundColor: '#fbf9f8' }}>
            <StatusBar style="dark" />
            <RootNavigator />
          </View>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

export default Sentry.wrap(RootLayout)
