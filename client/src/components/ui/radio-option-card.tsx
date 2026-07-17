import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, Text, View } from "react-native";

import { pressableNoRipple } from "@/constants/pressable";

type RadioOptionCardProps = {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

export function RadioOptionCard({ label, icon, selected, onPress }: RadioOptionCardProps) {
  return (
    <Pressable
      {...pressableNoRipple}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={`flex-1 min-w-[45%] rounded-lg border p-4 ${selected ? "border-primary bg-primary-fixed" : "border-outline-variant bg-surface-container-lowest"}`}
    >
      <View className="items-center">
        <MaterialIcons name={icon} size={28} color={selected ? "#041c37" : "#44474d"} />
        <Text className={`mt-2 font-label-sm text-label-sm ${selected ? "text-on-primary-fixed" : "text-on-surface"}`}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
