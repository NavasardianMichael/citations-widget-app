import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { TopAppBar } from "@/components/ui/top-app-bar";
import { SignInRequired } from "@/components/sign-in-required";
import { useAuth } from "@/contexts/auth-context";
import { t } from "@/i18n";
import { hasErrors, validateName, type FieldErrors } from "@/lib/validation";
import { fetchProfile, updateProfile } from "@/services/api";
import { deleteAccountRequest } from "@/services/auth-api";
import { getAccessToken } from "@/services/auth-storage";
import type { UserProfile } from "@/types/citation";

export default function ProfileScreen() {
  const { user, isGuest, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<"name">>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await fetchProfile();
      setProfile(fetched);
      setName(fetched.name ?? "");
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
        <TopAppBar title={t("profile.title")} showBrandIcon />
        <SignInRequired />
      </View>
    );
  }

  async function handleSaveProfile() {
    const nextErrors: FieldErrors<"name"> = { name: validateName(name) ?? undefined };
    setFieldErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSaving(true);
    try {
      const updated = await updateProfile({
        name: name.trim(),
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
      <TopAppBar title={t("profile.title")} showBrandIcon />
      <ScrollView className="flex-1" contentContainerClassName="pb-28 md:pb-12">
        <View className="mx-auto w-full max-w-xl px-margin-mobile py-8 md:px-margin-desktop md:py-12">
          <View
            className="relative overflow-hidden rounded-lg bg-surface-bright p-8 gap-8"
            style={{ boxShadow: "0 4px 20px -2px rgba(2, 26, 53, 0.05)" }}
          >
            <View className="absolute bottom-0 left-0 top-0 w-1 bg-secondary" />
            <Text className="font-headline-md text-headline-md text-primary">{t("profile.scholarTitle")}</Text>
            <View className="gap-6">
              <FormField
                label={t("profile.name")}
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={fieldErrors.name}
                variant="academic"
                autoCapitalize="words"
                textContentType="name"
                autoComplete="name"
              />
              <FormField
                label={t("profile.socialUrl")}
                value={socialUrl}
                onChangeText={setSocialUrl}
                placeholder="https://…"
                variant="academic"
              />
            </View>
            <View className="gap-3">
              <Button
                label={saving ? t("common.saving") : t("profile.saveChanges")}
                onPress={handleSaveProfile}
                disabled={saving}
                className="w-full md:w-auto"
              />
              {profile && "email" in profile && profile.email ? (
                <Text className="text-sm text-on-surface-variant">
                  {t("profile.signedInAs", { email: String(profile.email) })}
                </Text>
              ) : null}
              <Button
                label={t("profile.signOut")}
                variant="secondary"
                onPress={confirmSignOut}
                className="w-full md:w-auto"
              />
              <Button
                label={deleting ? t("common.saving") : t("profile.removeAccount")}
                variant="secondary"
                icon="delete-forever"
                disabled={deleting}
                onPress={confirmDeleteAccount}
                className="w-full md:w-auto"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
