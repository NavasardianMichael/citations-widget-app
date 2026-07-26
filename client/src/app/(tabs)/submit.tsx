import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, useWindowDimensions, View } from "react-native";

import { Button } from "@/components/ui/button";
import { CitationForm, emptyCitationFormValues, type CitationFormValues } from "@/components/citation-form";
import { SignInRequired } from "@/components/sign-in-required";
import { TopAppBar } from "@/components/ui/top-app-bar";
import { useAuth } from "@/contexts/auth-context";
import { t } from "@/i18n";
import { hasErrors, validateCitationForm, validateCitationTextMax, type FieldErrors } from "@/lib/validation";
import { createCitation } from "@/services/api";

export default function SubmitScreen() {
  const { user, isGuest } = useAuth();
  const { width } = useWindowDimensions();
  const isMd = width >= 768;

  const [values, setValues] = useState<CitationFormValues>(() => emptyCitationFormValues());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<"text" | "source">>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(visibility: "private" | "pending") {
    const nextErrors = validateCitationForm(values);
    setFieldErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      await createCitation({
        text: values.text.trim(),
        source: values.source.trim(),
        category: values.category,
        visibility,
      });
      Alert.alert(
        visibility === "private" ? t("submit.savedTitle") : t("submit.submittedTitle"),
        visibility === "private" ? t("submit.savedBody") : t("submit.submittedBody"),
        [
          { text: t("submit.viewSubmissions"), onPress: () => router.push("/") },
          { text: t("common.ok") },
        ],
      );
      setValues(emptyCitationFormValues());
      setFieldErrors({});
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("submit.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!user && isGuest) {
    return (
      <View className="flex-1 bg-background">
        <TopAppBar title={t("submit.title")} showBrandIcon />
        <SignInRequired />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <TopAppBar title={t("submit.title")} showBrandIcon />
      <ScrollView className="flex-1" contentContainerClassName="pb-28 md:pb-12">
        <View className="mx-auto w-full max-w-2xl gap-12 px-margin-mobile py-8 md:px-margin-desktop md:py-12">
          <View className={`max-w-lg gap-3 ${isMd ? "" : "items-center self-center"}`}>
            <Text
              className={`font-body-md text-body-md text-on-surface-variant ${isMd ? "text-left" : "text-center"}`}
            >
              {t("submit.heroBody")}
            </Text>
            <Text
              className={`font-label-sm text-label-sm text-on-surface-variant ${isMd ? "text-left" : "text-center"}`}
            >
              {t("submit.conditionsNoteBefore")}
              <Text
                className="font-label-sm text-label-sm text-primary underline"
                onPress={() => router.push("/approval-conditions" as Href)}
                accessibilityRole="link"
              >
                {t("submit.conditionsLink")}
              </Text>
              {t("submit.conditionsNoteAfter")}
            </Text>
          </View>

          <CitationForm
            values={values}
            onChange={(next) => {
              setValues(next);
              setFieldErrors((prev) => {
                const updated = { ...prev };
                if (next.text !== values.text) {
                  const maxError = validateCitationTextMax(next.text);
                  if (maxError) updated.text = maxError;
                  else delete updated.text;
                }
                if (next.source !== values.source) delete updated.source;
                return updated;
              });
            }}
            errors={fieldErrors}
            disabled={submitting}
            footer={
              <View className="flex-col gap-4 md:flex-row md:items-center md:justify-end">
                {isMd ? (
                  <View className="mr-auto flex-row items-center gap-2">
                    <MaterialIcons name="info" size={16} color="#44474d" />
                    <Text className="font-label-sm text-label-sm text-on-surface-variant">{t("submit.pendingHint")}</Text>
                  </View>
                ) : null}
                <Button
                  label={t("submit.savePrivate")}
                  variant="secondary"
                  icon="bookmark-add"
                  className="w-full md:w-auto"
                  disabled={submitting}
                  onPress={() => handleSubmit("private")}
                />
                <Button
                  label={submitting ? t("submit.submitting") : t("submit.forReview")}
                  icon="history-edu"
                  className="w-full md:w-auto"
                  disabled={submitting}
                  onPress={() => handleSubmit("pending")}
                />
              </View>
            }
          />

          <View className="items-center opacity-50">
            <MaterialIcons name="auto-awesome" size={40} color="#fed65b" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
