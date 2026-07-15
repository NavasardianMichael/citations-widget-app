import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, Text, View } from "react-native";

import { StatusBadge } from "@/components/status-badge";
import { pressableNoRipple } from "@/constants/pressable";
import { t } from "@/i18n";
import type { OwnedCitation } from "@/types/citation";

type SubmissionCardProps = {
  citation: OwnedCitation;
  onEdit?: () => void;
  onDelete?: () => void;
};

function formatSubmittedDate(value?: string) {
  if (!value) return t("card.submittedRecent");
  const date = new Date(value).toLocaleDateString("hy-AM", { month: "short", day: "numeric", year: "numeric" });
  return t("card.submittedOn", { date });
}

export function SubmissionCard({ citation, onEdit, onDelete }: SubmissionCardProps) {
  const isApproved = citation.status === "approved";
  const isRejected = citation.status === "rejected";
  const borderClass = isApproved ? "border-secondary" : "border-outline-variant";
  const textClass = isRejected ? "text-on-surface-variant opacity-70" : "text-primary";

  return (
    <View
      className="relative mb-6 overflow-hidden rounded-lg bg-surface-bright p-6"
      style={{ boxShadow: "0 4px 20px -2px rgba(2, 26, 53, 0.05)" }}
    >
      {isApproved ? <View className="absolute bottom-0 left-0 top-0 w-1 bg-secondary" /> : null}

      <View className="mb-4 flex-row items-start justify-between">
        <StatusBadge status={citation.status} />
        <View className="flex-row gap-2">
          {onEdit ? (
            <Pressable {...pressableNoRipple} onPress={onEdit} accessibilityLabel={t("card.editSubmission")} className="p-1">
              <MaterialIcons name="edit" size={20} color="#74777e" />
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable {...pressableNoRipple} onPress={onDelete} accessibilityLabel={t("card.deleteSubmission")} className="p-1">
              <MaterialIcons name="delete" size={20} color="#74777e" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text className={`mb-4 border-l-2 ${borderClass} py-2 pl-4 font-citation-xl text-citation-xl italic ${textClass}`}>
        "{citation.text}"
      </Text>

      <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
        {formatSubmittedDate(citation.createdAt)}
      </Text>

      {citation.moderatorNote ? (
        <Text className="mt-3 text-sm text-on-error-container">
          {t("common.note")}: {citation.moderatorNote}
        </Text>
      ) : null}

      {isApproved && citation.removableOnRequest ? (
        <Text className="mt-2 font-label-sm text-label-sm text-outline-variant">{t("card.removableNote")}</Text>
      ) : null}
    </View>
  );
}
