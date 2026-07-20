import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

type SettingsSectionProps = {
  title: string
  icon: keyof typeof MaterialIcons.glyphMap
  children: ReactNode
}

export function SettingsSection({
  title,
  icon,
  children,
}: SettingsSectionProps) {
  return (
    <View
      className='relative gap-6 overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-lowest p-6 md:p-8'
      style={{ boxShadow: '0 4px 20px rgba(2, 26, 53, 0.15)' }}
    >
      <View className='flex-row items-start gap-3'>
        <MaterialIcons name={icon} size={22} color='#735c00' style={{ marginTop: 4 }} />
        <Text
          className='min-w-0 flex-1 font-headline-md text-primary'
          style={{ fontSize: 20, lineHeight: 28, fontWeight: '600' }}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  )
}
