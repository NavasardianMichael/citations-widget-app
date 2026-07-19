import { Image } from 'expo-image'
import { StyleSheet, View } from 'react-native'
import Animated, { Easing, Keyframe } from 'react-native-reanimated'

const DURATION = 300

export function AnimatedSplashOverlay() {
  return null
}

const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ scale: 0.92 }],
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.out(Easing.cubic),
  },
})

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
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
