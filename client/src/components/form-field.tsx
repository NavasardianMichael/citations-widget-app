import { Text, TextInput, View, type TextInputProps } from "react-native";

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
  error?: string | null;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  textContentType?: TextInputProps["textContentType"];
  autoComplete?: TextInputProps["autoComplete"];
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
  error,
  secureTextEntry = false,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  textContentType,
  autoComplete,
}: FormFieldProps) {
  const hasError = Boolean(error);

  const labelClass =
    variant === "paper"
      ? "mb-2 font-label-sm text-label-sm text-primary"
      : "mb-2 font-label-sm text-label-sm text-on-surface-variant";

  const borderClass = hasError ? "border-error" : "border-outline-variant";

  const inputClass =
    variant === "paper"
      ? `w-full border ${borderClass} bg-transparent px-4 font-body-md text-body-md text-on-surface ${multiline ? "min-h-[120px] py-4" : "py-2"}`
      : variant === "academic"
        ? `w-full border-b ${borderClass} bg-transparent px-0 py-2 font-body-md text-body-md text-on-surface`
        : `rounded-lg border ${borderClass} bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface ${multiline ? "min-h-[120px]" : ""}`;

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
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        textContentType={textContentType}
        autoComplete={autoComplete}
        className={inputClass}
        style={multiline && variant === "paper" ? { fontStyle: "normal" } : undefined}
        textAlignVertical={multiline ? "top" : "auto"}
        accessibilityState={{ disabled: !editable }}
      />
      {hasError ? <Text className="mt-2 font-label-sm text-label-sm text-error">{error}</Text> : null}
    </View>
  );
}
