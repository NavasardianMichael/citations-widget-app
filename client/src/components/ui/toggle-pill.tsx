import { Pressable, Text, View } from "react-native";

import { pressableNoRipple } from "@/constants/pressable";

type TogglePillProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  variant?: "default" | "category";
  disabled?: boolean;
};

export function TogglePill<T extends string>({
  options,
  value,
  onChange,
  variant = "default",
  disabled = false,
}: TogglePillProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        const selectedClass =
          variant === "category"
            ? "border-secondary-container bg-secondary-container"
            : "border-primary bg-primary-fixed";
        const selectedTextClass = variant === "category" ? "text-on-secondary-container" : "text-on-primary-fixed";

        return (
          <Pressable
            {...pressableNoRipple}
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`rounded border px-4 py-2 ${selected ? selectedClass : "border-outline-variant bg-surface-container-lowest"}`}
          >
            <Text className={`font-body-md text-body-md ${selected ? selectedTextClass : "text-on-surface-variant"}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
