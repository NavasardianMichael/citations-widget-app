import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
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

function ProfileAvatar({ avatarUrl }: { avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: 56, height: 56, borderRadius: 28 }}
        contentFit="cover"
        accessibilityLabel={t("profile.avatarAlt")}
      />
    );
  }
  return (
    <View
      className="h-14 w-14 items-center justify-center rounded-full bg-surface-container-high"
      accessibilityLabel={t("profile.avatarAlt")}
    >
      <MaterialIcons name="person" size={28} color="#44474d" />
    </View>
  );
}

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
          await signOut({ redirectTo: "/auth/logged-out" });
          router.replace("/auth/logged-out");
        },
      },
    ]);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const accessToken = await getAccessToken();
      if (accessToken) await deleteAccountRequest(accessToken);
      await signOut({ redirectTo: "/auth/account-deleted" });
      router.replace("/auth/account-deleted");
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

            <View className="flex-row items-center gap-4">
              <ProfileAvatar avatarUrl={profile?.avatarUrl ?? null} />
              {profile && "email" in profile && profile.email ? (
                <Text className="flex-1 font-body-md text-body-md text-on-surface-variant">
                  {profile.email}
                </Text>
              ) : null}
            </View>

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
              <View className="gap-1">
                <FormField
                  label={t("profile.socialUrl")}
                  value={socialUrl}
                  onChangeText={setSocialUrl}
                  placeholder="https://…"
                  variant="academic"
                />
                <Text className="text-sm text-on-surface-variant">{t("settings.attributionDesc")}</Text>
              </View>
            </View>
            <View className="gap-3">
              <Button
                label={saving ? t("common.saving") : t("profile.saveChanges")}
                onPress={handleSaveProfile}
                disabled={saving}
                className="w-full md:w-auto"
              />
              <Button
                label={t("profile.signOut")}
                variant="secondary"
                onPress={confirmSignOut}
                className="w-full md:w-auto"
              />
              <Button
                label={deleting ? t("common.saving") : t("profile.removeAccount")}
                variant="danger"
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
