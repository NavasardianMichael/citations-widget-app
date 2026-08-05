import { Modal, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { t } from '@/i18n'

/**
 * Shown right after sign-in when this device has unsaved guest data (saved
 * citations / widget settings) AND the signed-in account already has its own
 * data — silently picking a side would either overwrite the account or
 * quietly drop the device's changes, so the user decides instead.
 */
export function GuestConflictModal() {
  const { guestConflict, resolveGuestConflict } = useAuth()
  const insets = useSafeAreaInsets()

  return (
    <Modal
      visible={guestConflict}
      transparent
      animationType='fade'
      onRequestClose={() => {}}
    >
      <View
        className='flex-1 items-center justify-center bg-black/50 px-6'
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View
          className='w-full max-w-sm gap-6 rounded-lg bg-surface-bright p-6'
          style={{ boxShadow: '0 12px 32px rgba(2, 26, 53, 0.25)' }}
        >
          <View className='gap-2'>
            <Text className='font-headline-md text-headline-md text-primary text-center'>
              {t('guestConflict.title')}
            </Text>
            <Text className='font-body-sm text-body-sm text-on-surface-variant text-center'>
              {t('guestConflict.body')}
            </Text>
          </View>

          <Button
            label={`${t('guestConflict.keepLocal')}:\n(${t('guestConflict.keepLocalHint')})`}
            onPress={() => resolveGuestConflict('keep-local')}
            className='w-full'
            labelClassName='text-center'
          />

          <Button
            label={`${t('guestConflict.useRemote')}:\n(${t('guestConflict.useRemoteHint')})`}
            variant='secondary'
            onPress={() => resolveGuestConflict('use-remote')}
            className='w-full'
            labelClassName='text-center'
          />
        </View>
      </View>
    </Modal>
  )
}
