import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, View } from "react-native";

import type { CitationStatus } from "@/types/citation";

const statusStyles: Record<
  CitationStatus,
  { bg: string; text: string; label: string; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  approved: { bg: "bg-secondary-container", text: "text-on-secondary-container", label: "Approved", icon: "check-circle" },
  pending: { bg: "bg-surface-container-highest", text: "text-on-surface-variant", label: "Pending Approval", icon: "schedule" },
  rejected: { bg: "bg-error-container", text: "text-on-error-container", label: "Rejected", icon: "cancel" },
  private: { bg: "bg-surface-container-high", text: "text-on-surface-variant", label: "Private", icon: "lock" },
};

export function StatusBadge({ status }: { status: CitationStatus }) {
  const style = statusStyles[status];
  return (
    <View className={`flex-row items-center rounded px-2 py-1 ${style.bg}`}>
      <MaterialIcons name={style.icon} size={14} color={status === "approved" ? "#745c00" : status === "rejected" ? "#93000a" : "#44474d"} />
      <Text className={`ml-1 font-label-sm text-label-sm ${style.text}`}>{style.label}</Text>
    </View>
  );
}
