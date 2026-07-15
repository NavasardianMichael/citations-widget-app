import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/button";
import { CitationForm, citationToFormValues, type CitationFormValues } from "@/components/citation-form";
import { FilterPill } from "@/components/filter-pill";
import { FormField } from "@/components/form-field";
import { SubmissionCard } from "@/components/submission-card";
import { TopAppBar } from "@/components/top-app-bar";
import { useAuth } from "@/contexts/auth-context";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { t } from "@/i18n";
import { deleteCitation, fetchMyCitations, fetchProfile, updateCitation, updateProfile } from "@/services/api";
import type { CitationStatus, OwnedCitation, UserProfile } from "@/types/citation";

const FILTER_OPTIONS: { value: "all" | CitationStatus; labelKey: "profile.filterAll" | "profile.filterPending" | "profile.filterApproved" | "profile.filterRejected" | "profile.filterPrivate" }[] = [
  { value: "all", labelKey: "profile.filterAll" },
  { value: "pending", labelKey: "profile.filterPending" },
  { value: "approved", labelKey: "profile.filterApproved" },
  { value: "rejected", labelKey: "profile.filterRejected" },
  { value: "private", labelKey: "profile.filterPrivate" },
];

export default function ProfileScreen() {
  const { isMd } = useBreakpoint();
  const { signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [submissions, setSubmissions] = useState<OwnedCitation[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | CitationStatus>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<CitationFormValues | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [user, mine] = await Promise.all([fetchProfile(), fetchMyCitations("all")]);
      setProfile(user);
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setSocialUrl(user.socialUrl ?? "");
      setSubmissions(mine);
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("profile.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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

  async function handleDelete(id: string) {
    Alert.alert(t("profile.deleteTitle"), t("profile.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.deleteAction"),
        style: "destructive",
        onPress: async () => {
          await deleteCitation(id);
          setSubmissions((prev) => prev.filter((c) => c.id !== id));
        },
      },
    ]);
  }

  function startEdit(citation: OwnedCitation) {
    setEditingId(citation.id);
    setEditValues(citationToFormValues(citation));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(null);
  }

  async function handleSaveEdit(id: string) {
    if (!editValues?.text.trim()) {
      Alert.alert(t("submit.missingTextTitle"), t("submit.missingTextBody"));
      return;
    }

    setSavingEdit(true);
    try {
      const updated = await updateCitation(id, {
        text: editValues.text.trim(),
        author: editValues.author.trim() || null,
        source: editValues.source.trim() || null,
        category: editValues.category,
        shareProfile: editValues.shareProfile,
      });
      setSubmissions((prev) => prev.map((c) => (c.id === id ? updated : c)));
      cancelEdit();
      Alert.alert(
        t("common.save"),
        updated.status === "pending" ? t("profile.citationPendingReview") : t("profile.citationUpdated"),
      );
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("profile.updateCitationFailed"));
    } finally {
      setSavingEdit(false);
    }
  }

  const filteredSubmissions =
    statusFilter === "all" ? submissions : submissions.filter((citation) => citation.status === statusFilter);

  const profileColumn = (
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
        <Text className="mt-4 text-sm text-on-surface-variant">{t("profile.signedInAs", { email: String(profile.email) })}</Text>
      ) : null}
      <Button
        label={t("profile.signOut")}
        variant="secondary"
        onPress={async () => {
          await signOut();
          router.replace("/auth/login");
        }}
        className="mt-4 w-full md:w-auto"
      />
    </View>
  );

  const submissionsColumn = (
    <View>
      <View className="mb-8 gap-4 border-b border-outline-variant pb-4">
        <Text className="font-headline-md text-headline-md text-primary">{t("profile.mySubmissions")}</Text>
        <View className="flex-row flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <FilterPill
              key={option.value}
              label={t(option.labelKey)}
              selected={statusFilter === option.value}
              onPress={() => setStatusFilter(option.value)}
            />
          ))}
        </View>
      </View>

      {filteredSubmissions.length === 0 ? (
        <Text className="font-body-md text-body-md text-on-surface-variant">{t("profile.noSubmissions")}</Text>
      ) : (
        filteredSubmissions.map((citation) =>
          editingId === citation.id && editValues ? (
            <View key={citation.id} className="mb-6">
              <CitationForm
                values={editValues}
                onChange={setEditValues}
                disabled={savingEdit}
                footer={
                  <View className="flex-row justify-end gap-3">
                    <Button label={t("common.cancel")} variant="secondary" onPress={cancelEdit} disabled={savingEdit} />
                    <Button
                      label={savingEdit ? t("common.saving") : t("profile.saveChanges")}
                      onPress={() => handleSaveEdit(citation.id)}
                      disabled={savingEdit}
                    />
                  </View>
                }
              />
            </View>
          ) : (
            <SubmissionCard
              key={citation.id}
              citation={citation}
              onEdit={() => startEdit(citation)}
              onDelete={() => handleDelete(citation.id)}
            />
          ),
        )
      )}
    </View>
  );

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
        <View className="mx-auto w-full max-w-[1200px] px-margin-mobile py-8 md:px-margin-desktop md:py-12">
          {isMd ? (
            <View className="flex-row items-start gap-gutter">
              <View className="w-4/12">{profileColumn}</View>
              <View className="w-8/12">{submissionsColumn}</View>
            </View>
          ) : (
            <View className="gap-12">
              {profileColumn}
              {submissionsColumn}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
