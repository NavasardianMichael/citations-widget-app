import { Text, TextInput, View } from "react-native";

import { t } from "@/i18n";

type FormFieldVariant = "default" | "paper" | "academic";

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  optional?: boolean;
  variant?: FormFieldVariant;
  editable?: boolean;
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  optional = false,
  variant = "default",
  editable = true,
}: FormFieldProps) {
  const labelClass =
    variant === "paper"
      ? "mb-2 font-label-sm text-label-sm text-primary"
      : "mb-2 font-label-sm text-label-sm text-on-surface-variant";

  const inputClass =
    variant === "paper"
      ? `w-full border border-outline-variant bg-transparent px-4 font-body-md text-body-md text-on-surface ${multiline ? "min-h-[120px] py-4" : "py-2"}`
      : variant === "academic"
        ? "w-full border-b border-outline-variant bg-transparent px-0 py-2 font-body-md text-body-md text-on-surface"
        : `rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface ${multiline ? "min-h-[120px]" : ""}`;

  return (
    <View className="mb-6">
      <Text className={labelClass}>
        {label}
        {optional ? ` (${t("common.optional")})` : ""}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#74777e"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        editable={editable}
        className={inputClass}
        style={multiline && variant === "paper" ? { fontStyle: "normal" } : undefined}
        textAlignVertical={multiline ? "top" : "auto"}
      />
    </View>
  );
}
