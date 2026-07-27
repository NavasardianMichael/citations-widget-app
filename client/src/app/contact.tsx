import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter, type Href } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { TopAppBar } from '@/components/ui/top-app-bar'
import { pressableNoRipple } from '@/constants/pressable'
import { useAuth } from '@/contexts/auth-context'
import { t } from '@/i18n'
import {
  hasErrors,
  validateContactMessage,
  validateEmail,
  validateName,
  type FieldErrors,
} from '@/lib/validation'
import { sendContactMessage } from '@/services/api'

export default function ContactScreen() {
  const router = useRouter()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<'name' | 'email' | 'message'>
  >({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name ?? '')
    setEmail(user.email ?? '')
  }, [user])

  async function handleSend() {
    const nextErrors: FieldErrors<'name' | 'email' | 'message'> = {
      name: validateName(name) ?? undefined,
      email: validateEmail(email) ?? undefined,
      message: validateContactMessage(message) ?? undefined,
    }
    setFieldErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSending(true)
    try {
      await sendContactMessage({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      })
      setSent(true)
    } catch (e) {
      setFieldErrors({
        message: e instanceof Error ? e.message : t('contact.sendFailed'),
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <View className='flex-1 bg-background'>
      <TopAppBar
        title={t('contact.title')}
        leftAction={
          <Pressable
            {...pressableNoRipple}
            onPress={() => router.back()}
            accessibilityLabel={t('common.back')}
            hitSlop={8}
            className='h-10 w-10 items-center justify-center'
          >
            <MaterialIcons name='arrow-back' size={24} color='#021a35' />
          </Pressable>
        }
      />
      <ScrollView className='flex-1' contentContainerClassName='pb-28 md:pb-12'>
        <View className='mx-auto w-full max-w-xl gap-8 px-margin-mobile py-8 md:px-margin-desktop md:py-12'>
          {sent ? (
            <View
              className='items-center gap-4 rounded-lg bg-surface-bright p-10'
              style={{ boxShadow: '0 4px 20px -2px rgba(2, 26, 53, 0.05)' }}
            >
              <MaterialIcons name='mark-email-read' size={40} color='#021a35' />
              <Text className='text-center font-headline-md text-headline-md text-primary'>
                {t('contact.successTitle')}
              </Text>
              <Text className='text-center font-body-md text-body-md text-on-surface-variant'>
                {t('contact.successBody')}
              </Text>
              <Button
                label={t('contact.backToProfile')}
                onPress={() => router.replace('/profile' as Href)}
                className='mt-2 w-full md:w-auto'
              />
            </View>
          ) : (
            <View className='gap-8'>
              <Text className='font-body-md text-body-md text-on-surface-variant'>
                {t('contact.intro')}
              </Text>

              <FormField
                label={t('contact.fullName')}
                value={name}
                onChangeText={(v) => {
                  setName(v)
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => ({ ...prev, name: undefined }))
                  }
                }}
                error={fieldErrors.name}
                variant='paper'
                autoCapitalize='words'
                textContentType='name'
                autoComplete='name'
              />

              <FormField
                label={t('contact.email')}
                value={email}
                onChangeText={(v) => {
                  setEmail(v)
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }))
                  }
                }}
                error={fieldErrors.email}
                variant='paper'
                autoCapitalize='none'
                autoCorrect={false}
                keyboardType='email-address'
                textContentType='emailAddress'
                autoComplete='email'
              />

              <FormField
                label={t('contact.message')}
                value={message}
                onChangeText={(v) => {
                  setMessage(v)
                  if (fieldErrors.message) {
                    setFieldErrors((prev) => ({ ...prev, message: undefined }))
                  }
                }}
                error={fieldErrors.message}
                placeholder={t('contact.messagePlaceholder')}
                multiline
                variant='paper'
                autoCapitalize='sentences'
              />

              <Button
                label={sending ? t('contact.sending') : t('contact.send')}
                onPress={handleSend}
                disabled={sending}
                icon='send'
                className='w-full md:w-auto'
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
