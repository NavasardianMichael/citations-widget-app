import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, useWindowDimensions, View } from "react-native";

import { Button } from "@/components/button";
import { CitationForm, emptyCitationFormValues, type CitationFormValues } from "@/components/citation-form";
import { TopAppBar } from "@/components/top-app-bar";
import { t } from "@/i18n";
import { createCitation } from "@/services/api";

export default function SubmitScreen() {
  const { width } = useWindowDimensions();
  const isMd = width >= 768;

  const [values, setValues] = useState<CitationFormValues>(emptyCitationFormValues);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(visibility: "private" | "pending") {
    if (!values.text.trim()) {
      Alert.alert(t("submit.missingTextTitle"), t("submit.missingTextBody"));
      return;
    }

    setSubmitting(true);
    try {
      await createCitation({
        text: values.text.trim(),
        author: values.author.trim() || undefined,
        source: values.source.trim() || undefined,
        category: values.category,
        shareProfile: values.shareProfile,
        visibility,
      });
      Alert.alert(
        visibility === "private" ? t("submit.savedTitle") : t("submit.submittedTitle"),
        visibility === "private" ? t("submit.savedBody") : t("submit.submittedBody"),
        [
          { text: t("submit.viewProfile"), onPress: () => router.push("/profile") },
          { text: t("common.ok") },
        ],
      );
      setValues(emptyCitationFormValues());
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("submit.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <TopAppBar title={t("common.brand")} showBrandIcon />
      <ScrollView className="flex-1" contentContainerClassName="pb-28 md:pb-12">
        <View className="mx-auto w-full max-w-2xl px-margin-mobile py-8 md:px-margin-desktop md:py-12">
          <View className={`mb-12 ${isMd ? "items-start" : "items-center"}`}>
            <Text
              className={`mb-4 font-display-lg text-display-lg-mobile text-primary md:text-display-lg ${isMd ? "text-left" : "text-center"}`}
            >
              {t("submit.heroTitle")}
            </Text>
            <Text
              className={`max-w-lg font-body-lg text-body-lg text-on-surface-variant ${isMd ? "text-left" : "text-center"}`}
            >
              {t("submit.heroBody")}
            </Text>
          </View>

          <CitationForm
            values={values}
            onChange={setValues}
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

          <View className="mt-12 items-center opacity-50">
            <MaterialIcons name="auto-awesome" size={40} color="#fed65b" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
