import { Pressable, Text, View } from "react-native";

import { pressableNoRipple } from "@/constants/pressable";

type RadioListRowProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function RadioListRow({ label, selected, onPress }: RadioListRowProps) {
  return (
    <Pressable
      {...pressableNoRipple}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={`flex-row items-center rounded-lg border p-3 ${selected ? "border-primary bg-primary-fixed" : "border-outline-variant"}`}
    >
      <View className={`mr-3 h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? "border-primary bg-primary" : "border-outline-variant"}`}>
        {selected ? <View className="h-2 w-2 rounded-full bg-on-primary" /> : null}
      </View>
      <Text className={`font-body-md text-body-md ${selected ? "text-on-primary-fixed" : "text-on-surface"}`}>{label}</Text>
    </Pressable>
  );
}
