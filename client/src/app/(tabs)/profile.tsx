import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Image } from 'expo-image'
import { Link, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { TopAppBar } from '@/components/ui/top-app-bar'
import { pressableNoRipple } from '@/constants/pressable'
import { useAuth } from '@/contexts/auth-context'
import { useOnboarding } from '@/contexts/onboarding-context'
import { t } from '@/i18n'
import {
  hasErrors,
  validateName,
  validateSocialUrl,
  type FieldErrors,
} from '@/lib/validation'
import { fetchProfile, updateProfile } from '@/services/api'
import { deleteAccountRequest } from '@/services/auth-api'
import { getAccessToken } from '@/services/auth-storage'
import type { UserProfile } from '@/types/citation'

function ContactUsPrompt({ className = '' }: { className?: string }) {
  const [before, after] = t('profile.contactPrompt').split('{link}')
  return (
    <Text
      className={`font-body-sm text-body-sm text-on-surface-variant ${className}`}
    >
      {before}
      <Link href='/contact'>
        <Text className='font-body-md text-body-md text-primary underline'>
          {t('profile.contactUs')}
        </Text>
      </Link>
      {after}
    </Text>
  )
}

function ProfileAvatar({ avatarUrl }: { avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: 56, height: 56, borderRadius: 28 }}
        contentFit='cover'
        accessibilityLabel={t('profile.avatarAlt')}
      />
    )
  }
  return (
    <View
      className='h-14 w-14 items-center justify-center rounded-full bg-surface-container-high'
      accessibilityLabel={t('profile.avatarAlt')}
    >
      <MaterialIcons name='person' size={28} color='#44474d' />
    </View>
  )
}

export default function ProfileScreen() {
  const { user, isGuest, signOut } = useAuth()
  const { openTutorial } = useOnboarding()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [socialUrl, setSocialUrl] = useState('')
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<'name' | 'socialUrl'>
  >({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const tutorialAction = (
    <Pressable
      {...pressableNoRipple}
      onPress={openTutorial}
      accessibilityRole='button'
      accessibilityLabel={t('tutorial.openButton')}
      hitSlop={8}
      className='h-10 w-10 items-center justify-center rounded-full'
    >
      <MaterialIcons name='help-outline' size={24} color='#44474d' />
    </Pressable>
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const fetched = await fetchProfile()
      setProfile(fetched)
      setName(fetched.name ?? '')
      setSocialUrl(fetched.socialUrl ?? '')
    } catch (e) {
      Alert.alert(
        t('common.error'),
        e instanceof Error ? e.message : t('profile.loadFailed'),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (user) load()
    }, [user, load]),
  )

  if (!user && isGuest) {
    return (
      <View className='flex-1 bg-background'>
        <TopAppBar
          title={t('profile.title')}
          showBrandIcon
          rightAction={tutorialAction}
        />
        <View className='flex-1 items-center justify-center gap-6 px-margin-mobile py-12'>
          <Text className='text-center font-headline-md text-headline-md text-primary'>
            {t('guest.signInRequiredTitle')}
          </Text>
          <Text className='max-w-md text-center font-body-md text-body-md text-on-surface-variant'>
            {t('guest.signInRequiredBody')}
          </Text>
          <Button
            label={t('guest.signIn')}
            onPress={() => router.push('/auth/login')}
            className='w-full max-w-md'
          />
          <ContactUsPrompt className='max-w-md text-center' />
        </View>
      </View>
    )
  }

  const savedName = profile?.name ?? ''
  const savedSocialUrl = profile?.socialUrl ?? ''
  const hasChanges =
    name.trim() !== savedName.trim() ||
    (socialUrl.trim() || null) !== (savedSocialUrl.trim() || null)

  async function handleSaveProfile() {
    if (!hasChanges) return

    const nextErrors: FieldErrors<'name' | 'socialUrl'> = {
      name: validateName(name) ?? undefined,
      socialUrl: validateSocialUrl(socialUrl) ?? undefined,
    }
    setFieldErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSaving(true)
    try {
      const updated = await updateProfile({
        name: name.trim(),
        socialUrl: socialUrl.trim() || null,
      })
      setProfile(updated)
      setName(updated.name ?? '')
      setSocialUrl(updated.socialUrl ?? '')
      Alert.alert(t('common.save'), t('profile.updated'))
    } catch (e) {
      Alert.alert(
        t('common.error'),
        e instanceof Error ? e.message : t('profile.updateFailed'),
      )
    } finally {
      setSaving(false)
    }
  }

  function confirmSignOut() {
    Alert.alert(
      t('profile.signOutConfirmTitle'),
      t('profile.signOutConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.signOut'),
          style: 'destructive',
          onPress: async () => {
            await signOut({ redirectTo: '/auth/logged-out' })
            router.replace('/auth/logged-out')
          },
        },
      ],
    )
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      const accessToken = await getAccessToken()
      if (accessToken) await deleteAccountRequest(accessToken)
      await signOut({ redirectTo: '/auth/account-deleted' })
      router.replace('/auth/account-deleted')
    } catch (e) {
      Alert.alert(
        t('common.error'),
        e instanceof Error ? e.message : t('profile.removeAccountFailed'),
      )
    } finally {
      setDeleting(false)
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      t('profile.removeAccountConfirmTitle'),
      t('profile.removeAccountConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.removeAccount'),
          style: 'destructive',
          onPress: handleDeleteAccount,
        },
      ],
    )
  }

  if (loading) {
    return (
      <View className='flex-1 bg-background'>
        <TopAppBar
          title={t('profile.title')}
          showBrandIcon
          rightAction={tutorialAction}
        />
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#021a35' />
        </View>
      </View>
    )
  }

  return (
    <View className='flex-1 bg-background'>
      <TopAppBar
        title={t('profile.title')}
        showBrandIcon
        rightAction={tutorialAction}
      />
      <ScrollView className='flex-1' contentContainerClassName='pb-28 md:pb-12'>
        <View className='mx-auto w-full max-w-xl px-margin-mobile py-8 md:px-margin-desktop md:py-12'>
          <View
            className='relative overflow-hidden rounded-lg bg-surface-bright p-8 gap-8'
            style={{ boxShadow: '0 4px 20px -2px rgba(2, 26, 53, 0.05)' }}
          >
            <View className='absolute bottom-0 left-0 top-0 w-1 bg-secondary' />

            <View className='flex-row items-center gap-4'>
              <ProfileAvatar avatarUrl={profile?.avatarUrl ?? null} />
              {profile && 'email' in profile && profile.email ? (
                <Text className='flex-1 font-body-md text-body-md text-on-surface-variant'>
                  {profile.email}
                </Text>
              ) : null}
            </View>

            <View className='gap-6'>
              <FormField
                label={t('profile.name')}
                value={name}
                onChangeText={(v) => {
                  setName(v)
                  if (fieldErrors.name)
                    setFieldErrors((prev) => ({ ...prev, name: undefined }))
                }}
                error={fieldErrors.name}
                variant='academic'
                autoCapitalize='words'
                textContentType='name'
                autoComplete='name'
              />
              <View className='gap-1'>
                <FormField
                  label={t('profile.socialUrl')}
                  value={socialUrl}
                  onChangeText={(v) => {
                    setSocialUrl(v)
                    if (fieldErrors.socialUrl)
                      setFieldErrors((prev) => ({
                        ...prev,
                        socialUrl: undefined,
                      }))
                  }}
                  error={fieldErrors.socialUrl}
                  placeholder='https://…'
                  variant='academic'
                  autoCapitalize='none'
                  autoCorrect={false}
                  keyboardType='url'
                  textContentType='URL'
                />
                <Text className='text-sm text-on-surface-variant'>
                  {t('settings.attributionDesc')}
                </Text>
              </View>
            </View>
            <View className='gap-3'>
              <Button
                label={saving ? t('common.saving') : t('profile.saveChanges')}
                onPress={handleSaveProfile}
                disabled={saving || !hasChanges}
                className='w-full md:w-auto'
              />
              <Button
                label={t('profile.signOut')}
                variant='secondary'
                onPress={confirmSignOut}
                className='w-full md:w-auto'
              />
              <Button
                label={
                  deleting ? t('common.saving') : t('profile.removeAccount')
                }
                variant='danger'
                icon='delete-forever'
                disabled={deleting}
                onPress={confirmDeleteAccount}
                className='w-full md:w-auto'
              />
            </View>
          </View>
          <ContactUsPrompt className='mt-8 text-center' />
        </View>
      </ScrollView>
    </View>
  )
}
