import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

import { pressableNoRipple } from '@/constants/pressable'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type SecondaryBorder = 'outline' | 'secondary'
type PrimaryTone = 'secondary' | 'secondary-container'

type ButtonProps = {
  label: string
  onPress?: () => void
  variant?: ButtonVariant
  secondaryBorder?: SecondaryBorder
  primaryTone?: PrimaryTone
  disabled?: boolean
  className?: string
  icon?: keyof typeof MaterialIcons.glyphMap
  /** Custom leading content; takes precedence over `icon`. */
  leading?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'border bg-transparent',
  ghost: 'bg-transparent',
}

const secondaryBorderClasses: Record<SecondaryBorder, string> = {
  outline: 'border-outline',
  secondary: 'border-secondary',
}

const textClasses: Record<ButtonVariant, string> = {
  primary: '',
  secondary: 'text-primary',
  ghost: 'text-primary',
}

const primaryTextClasses: Record<PrimaryTone, string> = {
  secondary: 'text-secondary',
  'secondary-container': 'text-secondary-container',
}

const iconColors: Record<ButtonVariant, string> = {
  primary: '',
  secondary: '#021a35',
  ghost: '#021a35',
}

const primaryIconColors: Record<PrimaryTone, string> = {
  secondary: '#735c00',
  'secondary-container': '#fed65b',
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  secondaryBorder = 'outline',
  primaryTone = 'secondary-container',
  disabled = false,
  className = '',
  icon,
  leading,
}: ButtonProps) {
  const borderClass =
    variant === 'secondary' ? secondaryBorderClasses[secondaryBorder] : ''
  const labelClass =
    variant === 'primary'
      ? primaryTextClasses[primaryTone]
      : textClasses[variant]
  const iconColor =
    variant === 'primary' ? primaryIconColors[primaryTone] : iconColors[variant]

  return (
    <Pressable
      {...pressableNoRipple}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      className={`flex-row items-center justify-center gap-2 rounded px-6 py-3 ${variantClasses[variant]} ${borderClass} ${disabled ? 'opacity-50' : ''} ${className}`}
      style={
        variant === 'primary'
          ? { boxShadow: '0 1px 3px rgba(2, 26, 53, 0.2)' }
          : undefined
      }
    >
      {leading ? (
        leading
      ) : icon ? (
        <View>
          <MaterialIcons name={icon} size={18} color={iconColor} />
        </View>
      ) : null}
      <Text className={` ${labelClass}`}>{label}</Text>
    </Pressable>
  )
}
