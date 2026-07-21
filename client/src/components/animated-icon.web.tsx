import { Image } from 'expo-image'
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

const DURATION = 300

export function AnimatedSplashOverlay() {
  return null
}

export function AnimatedIcon() {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.92)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [opacity, scale])

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.imageContainer, { opacity, transform: [{ scale }] }]}>
        <Image style={styles.image} source={require('../../assets/images/splash-icon.png')} contentFit='contain' />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  image: {
    width: 96,
    height: 96,
  },
})
