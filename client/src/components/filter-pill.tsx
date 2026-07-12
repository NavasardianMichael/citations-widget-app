import { Pressable, Text } from "react-native";

import { pressableNoRipple } from "@/constants/pressable";

type FilterPillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function FilterPill({ label, selected, onPress }: FilterPillProps) {
  return (
    <Pressable
      {...pressableNoRipple}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`rounded-full px-4 py-2 ${selected ? "bg-primary" : "border border-outline bg-transparent"}`}
    >
      <Text className={`font-label-sm text-label-sm ${selected ? "text-on-primary" : "text-on-surface"}`}>{label}</Text>
    </Pressable>
  );
}
