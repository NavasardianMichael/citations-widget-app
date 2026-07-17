import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { TopAppBar } from "@/components/ui/top-app-bar";
import { SignInRequired } from "@/components/sign-in-required";
import { useAuth } from "@/contexts/auth-context";
import { t } from "@/i18n";
import { fetchProfile, updateProfile } from "@/services/api";
import { deleteAccountRequest } from "@/services/auth-api";
import { getAccessToken } from "@/services/auth-storage";
import type { UserProfile } from "@/types/citation";

export default function ProfileScreen() {
  const { user, isGuest, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await fetchProfile();
      setProfile(fetched);
      setFirstName(fetched.firstName ?? "");
      setLastName(fetched.lastName ?? "");
      setSocialUrl(fetched.socialUrl ?? "");
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("profile.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) load();
    }, [user, load]),
  );

  if (!user && isGuest) {
    return (
      <View className="flex-1 bg-background">
        <TopAppBar title={t("common.brand")} showBrandIcon />
        <SignInRequired />
      </View>
    );
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const updated = await updateProfile({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        socialUrl: socialUrl.trim() || null,
      });
      setProfile(updated);
      Alert.alert(t("common.save"), t("profile.updated"));
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("profile.updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  function confirmSignOut() {
    Alert.alert(t("profile.signOutConfirmTitle"), t("profile.signOutConfirmBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.signOut"),
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth/login");
        },
      },
    ]);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const accessToken = await getAccessToken();
      if (accessToken) await deleteAccountRequest(accessToken);
      await signOut();
      router.replace("/auth/login");
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("profile.removeAccountFailed"));
    } finally {
      setDeleting(false);
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(t("profile.removeAccountConfirmTitle"), t("profile.removeAccountConfirmBody"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("profile.removeAccount"), style: "destructive", onPress: handleDeleteAccount },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#021a35" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <TopAppBar title={t("common.brand")} showBrandIcon />
      <ScrollView className="flex-1" contentContainerClassName="pb-28 md:pb-12">
        <View className="mx-auto w-full max-w-xl px-margin-mobile py-8 md:px-margin-desktop md:py-12">
          <View
            className="relative overflow-hidden rounded-lg bg-surface-bright p-8"
            style={{ boxShadow: "0 4px 20px -2px rgba(2, 26, 53, 0.05)" }}
          >
            <View className="absolute bottom-0 left-0 top-0 w-1 bg-secondary" />
            <Text className="mb-6 font-headline-md text-headline-md text-primary">{t("profile.scholarTitle")}</Text>
            <FormField label={t("profile.firstName")} value={firstName} onChangeText={setFirstName} variant="academic" />
            <FormField label={t("profile.lastName")} value={lastName} onChangeText={setLastName} variant="academic" />
            <FormField
              label={t("profile.socialUrl")}
              value={socialUrl}
              onChangeText={setSocialUrl}
              placeholder="https://…"
              variant="academic"
            />
            <Button
              label={saving ? t("common.saving") : t("profile.saveChanges")}
              onPress={handleSaveProfile}
              disabled={saving}
              className="mt-2 w-full md:w-auto"
            />
            {profile && "email" in profile && profile.email ? (
              <Text className="mt-4 text-sm text-on-surface-variant">
                {t("profile.signedInAs", { email: String(profile.email) })}
              </Text>
            ) : null}
            <Button
              label={t("profile.signOut")}
              variant="secondary"
              onPress={confirmSignOut}
              className="mt-4 w-full md:w-auto"
            />
            <Button
              label={deleting ? t("common.saving") : t("profile.removeAccount")}
              variant="secondary"
              icon="delete-forever"
              disabled={deleting}
              onPress={confirmDeleteAccount}
              className="mt-4 w-full md:w-auto"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
