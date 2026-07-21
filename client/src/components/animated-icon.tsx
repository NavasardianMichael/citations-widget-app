import { Image } from 'expo-image'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

const DURATION = 600

export function AnimatedSplashOverlay() {
  const opacity = useRef(new Animated.Value(1)).current
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!visible) return

    let cancelled = false
    SplashScreen.hideAsync().finally(() => {
      if (cancelled) return
      Animated.timing(opacity, {
        toValue: 0,
        duration: DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !cancelled) setVisible(false)
      })
    })

    return () => {
      cancelled = true
    }
  }, [opacity, visible])

  if (!visible) return null

  return (
    <Animated.View style={[styles.splashOverlay, { opacity }]}>
      <Image style={styles.image} source={require('../../assets/images/splash-icon.png')} contentFit='contain' />
    </Animated.View>
  )
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Image style={styles.image} source={require('../../assets/images/splash-icon.png')} contentFit='contain' />
    </View>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 96,
    height: 96,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fbf9f8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
})
