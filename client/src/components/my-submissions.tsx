import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { CitationForm, citationToFormValues, type CitationFormValues } from "@/components/citation-form";
import { FilterPill } from "@/components/ui/filter-pill";
import { SubmissionCard } from "@/components/submission-card";
import { t } from "@/i18n";
import { hasErrors, validateCitationForm, type FieldErrors } from "@/lib/validation";
import { deleteCitation, fetchMyCitations, updateCitation } from "@/services/api";
import type { CitationStatus, OwnedCitation } from "@/types/citation";

const FILTER_OPTIONS: {
  value: "all" | CitationStatus;
  labelKey: "submit.filterAll" | "submit.filterPending" | "submit.filterApproved" | "submit.filterRejected" | "submit.filterPrivate";
}[] = [
  { value: "all", labelKey: "submit.filterAll" },
  { value: "pending", labelKey: "submit.filterPending" },
  { value: "approved", labelKey: "submit.filterApproved" },
  { value: "rejected", labelKey: "submit.filterRejected" },
  { value: "private", labelKey: "submit.filterPrivate" },
];

export function MySubmissions() {
  const [submissions, setSubmissions] = useState<OwnedCitation[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | CitationStatus>("all");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<CitationFormValues | null>(null);
  const [editErrors, setEditErrors] = useState<FieldErrors<"text" | "author" | "source">>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const mine = await fetchMyCitations("all");
      setSubmissions(mine);
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("submit.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleDelete(id: string) {
    Alert.alert(t("submit.deleteTitle"), t("submit.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("submit.deleteAction"),
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
    setEditErrors({});
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(null);
    setEditErrors({});
  }

  async function handleSaveEdit(id: string) {
    if (!editValues) return;
    const nextErrors = validateCitationForm(editValues);
    setEditErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

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
        updated.status === "pending" ? t("submit.citationPendingReview") : t("submit.citationUpdated"),
      );
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("submit.updateCitationFailed"));
    } finally {
      setSavingEdit(false);
    }
  }

  const filteredSubmissions =
    statusFilter === "all" ? submissions : submissions.filter((citation) => citation.status === statusFilter);

  return (
    <View>
      <View className="mb-8 gap-4 border-b border-outline-variant pb-4">
        <Text className="font-headline-md text-headline-md text-primary">{t("submit.mySubmissions")}</Text>
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

      {loading ? (
        <ActivityIndicator size="large" color="#021a35" className="py-12" />
      ) : filteredSubmissions.length === 0 ? (
        <Text className="font-body-md text-body-md text-on-surface-variant">{t("submit.noSubmissions")}</Text>
      ) : (
        filteredSubmissions.map((citation) =>
          editingId === citation.id && editValues ? (
            <View key={citation.id} className="mb-6">
              <CitationForm
                values={editValues}
                onChange={(next) => {
                  setEditValues(next);
                  if (editErrors.text || editErrors.author || editErrors.source) {
                    setEditErrors((prev) => {
                      const cleared = { ...prev };
                      if (next.text !== editValues.text) delete cleared.text;
                      if (next.author !== editValues.author) delete cleared.author;
                      if (next.source !== editValues.source) delete cleared.source;
                      return cleared;
                    });
                  }
                }}
                errors={editErrors}
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
}
