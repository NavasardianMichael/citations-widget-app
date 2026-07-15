import { Text, View } from "react-native";

import { t } from "@/i18n";
import type { CitationCategory } from "@/types/citation";

export function CategoryTag({ category }: { category: CitationCategory }) {
  const isBible = category === "bible";
  return (
    <View className={`rounded px-2 py-1 ${isBible ? "bg-primary-fixed" : "bg-secondary-container"}`}>
      <Text className={`font-label-sm text-label-sm uppercase ${isBible ? "text-on-primary-fixed" : "text-on-secondary-container"}`}>
        {isBible ? t("category.bible") : t("category.fiction")}
      </Text>
    </View>
  );
}
