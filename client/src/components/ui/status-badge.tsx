import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, View } from "react-native";

import { t } from "@/i18n";
import type { CitationStatus } from "@/types/citation";

const statusStyles: Record<
  CitationStatus,
  { bg: string; text: string; labelKey: "status.approved" | "status.pending" | "status.rejected" | "status.private"; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  approved: { bg: "bg-secondary-container", text: "text-on-secondary-container", labelKey: "status.approved", icon: "check-circle" },
  pending: { bg: "bg-surface-container-highest", text: "text-on-surface-variant", labelKey: "status.pending", icon: "schedule" },
  rejected: { bg: "bg-error-container", text: "text-on-error-container", labelKey: "status.rejected", icon: "cancel" },
  private: { bg: "bg-surface-container-high", text: "text-on-surface-variant", labelKey: "status.private", icon: "lock" },
};

export function StatusBadge({ status }: { status: CitationStatus }) {
  const style = statusStyles[status];
  return (
    <View className={`flex-row items-center gap-1 rounded px-2 py-1 ${style.bg}`}>
      <MaterialIcons name={style.icon} size={14} color={status === "approved" ? "#745c00" : status === "rejected" ? "#93000a" : "#44474d"} />
      <Text className={`font-label-sm text-label-sm ${style.text}`}>{t(style.labelKey)}</Text>
    </View>
  );
}
