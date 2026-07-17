import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, Text, View } from "react-native";

import { CategoryTag } from "@/components/ui/category-tag";
import { shadowLevel1 } from "@/constants/colors";
import { pressableNoRipple } from "@/constants/pressable";
import { t } from "@/i18n";
import type { Citation } from "@/types/citation";

export type CitationCardVariant = "decorative" | "minimalist" | "featured";

type CitationCardProps = {
  citation: Citation;
  variant?: CitationCardVariant;
  onUnsave?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  className?: string;
};

function authorInitial(author: string | null) {
  return author?.trim().charAt(0).toUpperCase() || "?";
}

export function CitationCard({
  citation,
  variant = "decorative",
  onUnsave,
  onSave,
  isSaved = true,
  className = "",
}: CitationCardProps) {
  if (variant === "featured") {
    return (
      <View className={className}>
        <View
          className="relative min-h-[300px] items-center justify-center overflow-hidden rounded-xl p-10"
          style={shadowLevel1}
        >
          <View className="absolute inset-0 bg-primary/80" />
          <View className="relative z-10 max-w-3xl items-center">
            <MaterialIcons name="format-quote" size={28} color="#fed65b" style={{ marginBottom: 16, opacity: 0.8 }} />
            <Text className="mb-6 text-center font-citation-xl text-citation-xl leading-relaxed text-white">
              "{citation.text}"
            </Text>
            <Text className="mb-6 font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">
              — {citation.author ?? t("card.unknownAuthor")}
              {citation.source ? `, ${citation.source}` : ""}
            </Text>
            {onUnsave ? (
              <Pressable
                {...pressableNoRipple}
                onPress={onUnsave}
                accessibilityLabel={t("card.removeSaved")}
                className="flex-row items-center gap-2 rounded-lg border border-secondary px-4 py-2"
              >
                <MaterialIcons name="bookmark-remove" size={16} color="#ffffff" />
                <Text className="font-label-sm text-label-sm text-white">{t("card.remove")}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  const bgClass = "bg-decorative-bg";
  const borderClass = variant === "decorative" ? "border-l-2 border-secondary" : "";
  const quoteClass = variant === "decorative" ? "font-citation-xl text-citation-xl italic" : "font-body-lg text-body-lg";

  return (
    <View className={className}>
      <View className={`relative overflow-hidden rounded-xl p-6 md:p-8 ${bgClass} ${borderClass}`} style={shadowLevel1}>
        {variant === "decorative" ? (
          <View className="absolute right-4 top-4 opacity-10">
            <MaterialIcons name="eco" size={36} color="#735c00" />
          </View>
        ) : null}

        <Text className={`relative z-10 mb-6 ${quoteClass} text-primary`}>"{citation.text}"</Text>

        <View className={`${variant === "minimalist" ? "mt-auto border-t border-outline-variant pt-4" : ""} flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <View className="flex-row items-center gap-3">
            {variant === "decorative" ? (
              <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-surface-container-high">
                <Text className="font-headline-md text-headline-md text-primary">{authorInitial(citation.author)}</Text>
              </View>
            ) : null}
            <View>
              {citation.author ? (
                <Text className="font-body-md text-body-md font-semibold text-primary">{citation.author}</Text>
              ) : null}
              {citation.source ? (
                <Text className="font-label-sm text-label-sm text-on-surface-variant">{citation.source}</Text>
              ) : null}
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {variant === "decorative" ? <CategoryTag category={citation.category} /> : null}
            {isSaved && onUnsave ? (
              <Pressable
                {...pressableNoRipple}
                onPress={onUnsave}
                accessibilityLabel={t("card.removeSaved")}
                className="h-10 w-10 items-center justify-center rounded-full"
              >
                <MaterialIcons
                  name={variant === "decorative" ? "bookmark-remove" : "delete"}
                  size={18}
                  color="#44474d"
                />
              </Pressable>
            ) : null}
            {!isSaved && onSave ? (
              <Pressable
                {...pressableNoRipple}
                onPress={onSave}
                accessibilityLabel={t("card.saveCitation")}
                className="h-10 w-10 items-center justify-center rounded-full bg-surface-container"
              >
                <MaterialIcons name="bookmark-border" size={18} color="#44474d" />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}
