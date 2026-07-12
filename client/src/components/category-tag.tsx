import { Text, View } from "react-native";

import type { SourceType } from "@/types/citation";

export function CategoryTag({ sourceType }: { sourceType: SourceType }) {
  const isBible = sourceType === "bible";
  return (
    <View className={`rounded px-2 py-1 ${isBible ? "bg-primary-fixed" : "bg-secondary-container"}`}>
      <Text className={`font-label-sm text-label-sm uppercase ${isBible ? "text-on-primary-fixed" : "text-on-secondary-container"}`}>
        {isBible ? "Bible" : "Fiction"}
      </Text>
    </View>
  );
}
