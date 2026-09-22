import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { t } from '@/i18n'
import { getUserFacingError } from '@/lib/user-facing-error'
import {
  hasErrors,
  validateChangePassword,
  type FieldErrors,
} from '@/lib/validation'
import { AuthApiError, changePasswordRequest } from '@/services/auth-api'
import { getAccessToken } from '@/services/auth-storage'

type Fields = 'currentPassword' | 'newPassword' | 'confirmPassword'

/**
 * Only reachable for `provider === "local"` accounts — Google sessions have no
 * password to change, and the server rejects the request for them anyway.
 */
export function ChangePasswordModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const insets = useSafeAreaInsets()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Fields>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function reset() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setFieldErrors({})
    setSubmitError(null)
  }

  function clearError(field: Fields) {
    setSubmitError(null)
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  function handleClose() {
    if (saving) return
    reset()
    onClose()
  }

  async function handleSubmit() {
    setSubmitError(null)
    const nextErrors = validateChangePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    })
    setFieldErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSaving(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new AuthApiError('', 'UNAUTHORIZED')
      await changePasswordRequest(accessToken, currentPassword, newPassword)
      reset()
      onSuccess()
    } catch (e) {
      // The server answers a wrong current password with 401 INVALID_CREDENTIALS —
      // pin that on the field instead of showing "email or password is wrong".
      if (e instanceof AuthApiError && e.code === 'INVALID_CREDENTIALS') {
        setFieldErrors({ currentPassword: t('profile.currentPasswordWrong') })
      } else {
        setSubmitError(getUserFacingError(e, 'profile.changePasswordFailed'))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className='flex-1'
      >
        <View
          className='flex-1 bg-black/50'
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          <ScrollView
            className='flex-1'
            contentContainerClassName='flex-grow justify-center px-6 py-8'
            keyboardShouldPersistTaps='handled'
          >
            <View
              className='mx-auto w-full max-w-sm gap-6 rounded-lg bg-surface-bright p-6'
              style={{ boxShadow: '0 12px 32px rgba(2, 26, 53, 0.25)' }}
            >
              <View className='gap-2'>
                <Text className='text-center font-headline-md text-headline-md text-primary'>
                  {t('profile.changePasswordTitle')}
                </Text>
                <Text className='text-center font-body-sm text-body-sm text-on-surface-variant'>
                  {t('profile.changePasswordSubtitle')}
                </Text>
              </View>

              {submitError ? (
                <Text className='text-center text-error'>{submitError}</Text>
              ) : null}

              <View className='gap-4'>
                <FormField
                  label={t('profile.currentPassword')}
                  value={currentPassword}
                  onChangeText={(v) => {
                    setCurrentPassword(v)
                    clearError('currentPassword')
                  }}
                  placeholder={t('profile.currentPasswordPlaceholder')}
                  error={fieldErrors.currentPassword}
                  secureTextEntry
                  autoCapitalize='none'
                  autoComplete='current-password'
                  textContentType='password'
                />
                <FormField
                  label={t('profile.newPassword')}
                  value={newPassword}
                  onChangeText={(v) => {
                    setNewPassword(v)
                    clearError('newPassword')
                    clearError('confirmPassword')
                  }}
                  placeholder={t('profile.newPasswordPlaceholder')}
                  error={fieldErrors.newPassword}
                  secureTextEntry
                  autoCapitalize='none'
                  autoComplete='new-password'
                  textContentType='newPassword'
                />
                <FormField
                  label={t('profile.confirmNewPassword')}
                  value={confirmPassword}
                  onChangeText={(v) => {
                    setConfirmPassword(v)
                    clearError('confirmPassword')
                  }}
                  placeholder={t('profile.confirmNewPasswordPlaceholder')}
                  error={fieldErrors.confirmPassword}
                  secureTextEntry
                  autoCapitalize='none'
                  autoComplete='new-password'
                  textContentType='newPassword'
                />
              </View>

              <View className='gap-3'>
                <Button
                  label={
                    saving
                      ? t('common.saving')
                      : t('profile.changePasswordSubmit')
                  }
                  onPress={handleSubmit}
                  disabled={saving}
                  className='w-full'
                />
                <Button
                  label={t('common.cancel')}
                  variant='secondary'
                  onPress={handleClose}
                  disabled={saving}
                  className='w-full'
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
