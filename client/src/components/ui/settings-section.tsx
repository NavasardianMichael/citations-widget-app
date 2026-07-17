import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

type SettingsSectionProps = {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  children: ReactNode;
};

export function SettingsSection({ title, icon, children }: SettingsSectionProps) {
  return (
    <View
      className="relative overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-lowest p-6 md:p-8"
      style={{ boxShadow: "0 4px 20px rgba(2, 26, 53, 0.15)" }}
    >
      <View className="mb-6 flex-row items-center">
        <MaterialIcons name={icon} size={22} color="#735c00" style={{ marginRight: 12 }} />
        <Text className="font-headline-md text-headline-md text-primary">{title}</Text>
      </View>
      {children}
    </View>
  );
}
