import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useState } from 'react'
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native'

import { pressableNoRipple } from '@/constants/pressable'
import { t } from '@/i18n'

type FormFieldVariant = 'default' | 'paper' | 'academic'

type FormFieldProps = {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  multiline?: boolean
  optional?: boolean
  variant?: FormFieldVariant
  editable?: boolean
  error?: string | null
  secureTextEntry?: boolean
  autoCapitalize?: TextInputProps['autoCapitalize']
  autoCorrect?: boolean
  keyboardType?: TextInputProps['keyboardType']
  textContentType?: TextInputProps['textContentType']
  autoComplete?: TextInputProps['autoComplete']
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  optional = false,
  variant = 'default',
  editable = true,
  error,
  secureTextEntry = false,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  textContentType,
  autoComplete,
}: FormFieldProps) {
  const hasError = Boolean(error)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const showToggle = secureTextEntry && !multiline
  const isSecure = secureTextEntry && !passwordVisible

  const labelClass =
    variant === 'paper'
      ? 'font-semibold text-primary'
      : 'font-semibold text-on-surface-variant'

  const borderClass = hasError ? 'border-error' : 'border-outline-variant'

  const inputClass =
    variant === 'paper'
      ? `w-full border ${borderClass} bg-transparent px-4 font-body-md text-body-md text-on-surface ${multiline ? 'min-h-[120px] py-4' : 'py-2'} ${showToggle ? 'pr-12' : ''}`
      : variant === 'academic'
        ? `w-full border-b ${borderClass} bg-transparent px-0 py-2 font-body-md text-body-md text-on-surface ${showToggle ? 'pr-10' : ''}`
        : `rounded-lg border ${borderClass} bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface ${multiline ? 'min-h-[120px]' : ''} ${showToggle ? 'pr-12' : ''}`

  return (
    <View className='gap-2'>
      <Text className={labelClass}>
        {label}
        {optional ? ` (${t('common.optional')})` : ''}
      </Text>
      <View className='relative w-full justify-center'>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor='#74777e'
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          editable={editable}
          secureTextEntry={isSecure}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          textContentType={textContentType}
          autoComplete={autoComplete}
          className={inputClass}
          style={
            multiline && variant === 'paper' ? { fontStyle: 'normal' } : undefined
          }
          textAlignVertical={multiline ? 'top' : 'auto'}
          accessibilityState={{ disabled: !editable }}
        />
        {showToggle ? (
          <Pressable
            {...pressableNoRipple}
            onPress={() => setPasswordVisible((prev) => !prev)}
            accessibilityRole='button'
            hitSlop={8}
            className='absolute right-2 h-10 w-10 items-center justify-center'
          >
            <MaterialIcons
              name={passwordVisible ? 'visibility-off' : 'visibility'}
              size={22}
              color='#44474d'
            />
          </Pressable>
        ) : null}
      </View>
      {hasError ? (
        <Text className='font-label-sm text-label-sm text-error'>
          {error}
        </Text>
      ) : null}
    </View>
  )
}
