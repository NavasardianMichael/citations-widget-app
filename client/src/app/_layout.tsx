import { useFonts } from 'expo-font'
import { DefaultTheme, ThemeProvider } from 'expo-router'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import '../global.css'

import { AnimatedSplashOverlay } from '@/components/animated-icon'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { APP_FONT_SOURCES } from '@/fonts/registry'

SplashScreen.preventAutoHideAsync()

function useProtectedRoute() {
  const { user, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === 'auth'

    if (!user && !inAuthGroup) {
      router.replace('/auth/login')
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [user, isLoading, segments, router])
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
      </Stack>
    </>
  )
}

export default function RootLayout() {
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
            <RootNavigator />
          </View>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
