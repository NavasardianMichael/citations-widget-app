import { StyleSheet, Text, View } from 'react-native'

type GoogleLogoProps = {
  size?: number
}

/** Compact Google "G" mark — avoids shipping the full FontAwesome icon font. */
export function GoogleLogo({ size = 18 }: GoogleLogoProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.72, lineHeight: size }]}>G</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  letter: {
    color: '#4285F4',
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
  },
})
