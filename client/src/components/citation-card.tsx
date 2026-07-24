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

function sourceLabel(source: string) {
  return source.trim() || t("card.unknownSource");
}

/** Larger, always pinned to the card's bottom-right corner (vs. inline in the meta row). */
function CornerActionButton({
  icon,
  label,
  onPress,
  tone,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  tone: "light" | "dark";
}) {
  return (
    <Pressable
      {...pressableNoRipple}
      onPress={onPress}
      accessibilityLabel={label}
      className={`absolute bottom-3 right-3 h-12 w-12 items-center justify-center rounded-full ${
        tone === "dark" ? "bg-white/15" : "bg-surface-bright"
      }`}
      style={shadowLevel1}
    >
      <MaterialIcons name={icon} size={22} color={tone === "dark" ? "#ffffff" : "#44474d"} />
    </Pressable>
  );
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
          <View className="relative z-10 max-w-3xl items-center gap-6">
            <MaterialIcons name="format-quote" size={28} color="#fed65b" style={{ opacity: 0.8 }} />
            <Text className="text-center font-citation-xl text-citation-xl leading-relaxed text-white">
              &quot;{citation.text}&quot;
            </Text>
            <Text className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">
              {sourceLabel(citation.source)}
            </Text>
          </View>
          {onUnsave ? (
            <CornerActionButton icon="bookmark-remove" label={t("card.removeSaved")} onPress={onUnsave} tone="dark" />
          ) : null}
        </View>
      </View>
    );
  }

  const bgClass = "bg-decorative-bg";
  const borderClass = variant === "decorative" ? "border-l-2 border-secondary" : "";
  const quoteClass = variant === "decorative" ? "font-citation-xl text-citation-xl italic" : "font-body-lg text-body-lg";

  return (
    <View className={className}>
      <View
        className={`relative gap-6 overflow-hidden rounded-xl p-6 pb-16 md:p-8 md:pb-16 ${bgClass} ${borderClass}`}
        style={shadowLevel1}
      >
        {variant === "decorative" ? (
          <View className="absolute right-4 top-4 opacity-10">
            <MaterialIcons name="eco" size={36} color="#735c00" />
          </View>
        ) : null}

        <Text className={`relative z-10 ${quoteClass} text-primary`}>&quot;{citation.text}&quot;</Text>

        <View
          className={`${variant === "minimalist" ? "mt-auto border-t border-outline-variant pt-4" : ""} flex-row items-center justify-between gap-4`}
        >
          <Text className="font-body-md text-body-md font-semibold text-primary">{sourceLabel(citation.source)}</Text>
          {variant === "decorative" ? <CategoryTag category={citation.category} /> : null}
        </View>

        {isSaved && onUnsave ? (
          <CornerActionButton icon="bookmark-remove" label={t("card.removeSaved")} onPress={onUnsave} tone="light" />
        ) : null}
        {!isSaved && onSave ? (
          <CornerActionButton icon="bookmark-border" label={t("card.saveCitation")} onPress={onSave} tone="light" />
        ) : null}
      </View>
    </View>
  );
}
