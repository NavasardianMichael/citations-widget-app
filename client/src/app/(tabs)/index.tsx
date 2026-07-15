import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { CitationCard, type CitationCardVariant } from "@/components/citation-card";
import { TopAppBar } from "@/components/top-app-bar";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { t } from "@/i18n";
import { fetchSavedCitations, unsaveCitation } from "@/services/api";
import type { Citation } from "@/types/citation";

const VARIANT_CYCLE: CitationCardVariant[] = ["decorative", "minimalist", "featured", "decorative", "minimalist"];

export default function SavedScreen() {
  const { isMd } = useBreakpoint();
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSavedCitations();
      setCitations(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saved.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [loadSaved]),
  );

  async function handleUnsave(id: string) {
    await unsaveCitation(id);
    setCitations((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <View className="flex-1 bg-background">
      <TopAppBar title={t("common.brand")} showBrandIcon />
      <ScrollView className="flex-1" contentContainerClassName="pb-28 md:pb-12">
        <View className="mx-auto w-full max-w-[1200px] px-margin-mobile pt-8 md:px-margin-desktop md:pt-12">
          <View className={`mb-12 ${isMd ? "items-start" : "items-center"}`}>
            <Text className={`mb-4 font-display-lg text-display-lg-mobile text-primary md:text-display-lg ${isMd ? "text-left" : "text-center"}`}>
              {t("saved.title")}
            </Text>
            <Text className={`max-w-2xl font-body-lg text-body-lg text-on-surface-variant ${isMd ? "text-left" : "text-center"}`}>
              {t("saved.subtitle")}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#021a35" className="py-12" />
          ) : error ? (
            <Text className="text-center text-error">{error}</Text>
          ) : citations.length === 0 ? (
            <View className="items-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-12">
              <Text className="mb-2 text-center font-headline-md text-headline-md text-primary">{t("saved.emptyTitle")}</Text>
              <Text className="text-center font-body-md text-body-md text-on-surface-variant">{t("saved.emptyBody")}</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-gutter">
              {citations.map((citation, index) => {
                const variant = VARIANT_CYCLE[index % VARIANT_CYCLE.length];
                const spanClass = variant === "featured" ? "w-full" : variant === "minimalist" ? "w-full md:w-4/12" : "w-full md:w-8/12";
                return (
                  <CitationCard
                    key={citation.id}
                    citation={citation}
                    variant={variant}
                    className={spanClass}
                    onUnsave={() => handleUnsave(citation.id)}
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
