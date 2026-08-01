import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { BrandLogo } from '@/components/ui/brand-logo'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { GoogleLogo } from '@/components/ui/google-logo'
import { SkipAuthLink } from '@/components/ui/skip-auth-link'
import { TextLink } from '@/components/ui/text-link'
import { pressableNoRipple } from '@/constants/pressable'
import { useAuth } from '@/contexts/auth-context'
import { t } from '@/i18n'
import { hasErrors, validateLogin, type FieldErrors } from '@/lib/validation'

export default function LoginScreen() {
  const router = useRouter()
  const {
    signIn,
    signInWithGoogle,
    googleAuthReady,
    isGoogleConfigured,
  } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<'email' | 'password'>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError(null)
    const nextErrors = validateLogin({ email, password })
    setFieldErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setLoading(true)
    try {
      await signIn(email.trim(), password)
      router.replace('/(tabs)')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.login.failed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError(null)
    setFieldErrors({})
    setLoading(true)
    try {
      const signedIn = await signInWithGoogle()
      if (!signedIn) return
      router.replace('/(tabs)')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.login.googleFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className='flex-1'
      >
        <ScrollView contentContainerClassName='flex-grow justify-center px-margin-mobile py-8 md:px-margin-desktop'>
          <View className='mx-auto w-full max-w-md gap-8'>
            <View className='gap-2'>
              <BrandLogo size={48} className='mb-2' />
              <Text className='font-display-lg text-display-lg-mobile text-primary'>
                {t('auth.login.title')}
              </Text>
              <Text className='font-body-md text-body-md text-on-surface-variant'>
                {t('auth.login.subtitle')}
              </Text>
            </View>

            <View className='gap-6'>
              {error ? <Text className='text-error'>{error}</Text> : null}

              <FormField
                label={t('auth.login.email')}
                value={email}
                onChangeText={(v) => {
                  setEmail(v)
                  if (fieldErrors.email)
                    setFieldErrors((prev) => ({ ...prev, email: undefined }))
                }}
                placeholder='you@example.com'
                error={fieldErrors.email}
                keyboardType='email-address'
                autoCapitalize='none'
                autoCorrect={false}
                autoComplete='email'
                textContentType='emailAddress'
              />
              <FormField
                label={t('auth.login.password')}
                value={password}
                onChangeText={(v) => {
                  setPassword(v)
                  if (fieldErrors.password)
                    setFieldErrors((prev) => ({ ...prev, password: undefined }))
                }}
                placeholder={t('auth.login.passwordPlaceholder')}
                error={fieldErrors.password}
                secureTextEntry
                autoCapitalize='none'
                autoComplete='password'
                textContentType='password'
              />

              <TextLink
                href='/auth/forgot-password'
                variant='underline'
                align='right'
              >
                {t('auth.login.forgot')}
              </TextLink>

              <View className='gap-3'>
                  <Button
                    label={
                      loading
                        ? t('auth.login.submitting')
                        : t('auth.login.submit')
                    }
                    onPress={() => handleLogin()}
                    disabled={loading}
                  />

                  {isGoogleConfigured ? (
                    <Button
                      label={t('auth.login.google')}
                      variant='secondary'
                      leading={<GoogleLogo />}
                      onPress={() => handleGoogleLogin()}
                      disabled={loading || !googleAuthReady}
                    />
                  ) : null}
                </View>
            </View>

            <View className='gap-4'>
              <View className='flex-row flex-wrap justify-center gap-1'>
                <Text className='font-body-md text-body-md text-on-surface-variant'>
                  {t('auth.login.noAccount')}
                </Text>
                <Link href='/auth/register' asChild>
                  <Pressable {...pressableNoRipple} accessibilityRole='link'>
                    <Text className='font-body-md text-body-md text-primary underline'>
                      {t('auth.login.createOne')}
                    </Text>
                  </Pressable>
                </Link>
              </View>

              <SkipAuthLink />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
