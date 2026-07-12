import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, View } from "react-native";

import { shadowLevel1 } from "@/constants/colors";
import type { FontStyle, WidgetCitation } from "@/types/citation";

type WidgetPreviewProps = {
  citation: WidgetCitation | null;
  fontStyle: FontStyle;
  loading?: boolean;
};

const fontFamilyMap: Record<FontStyle, string> = {
  source_serif_4: "SourceSerif4_400Regular_Italic",
  hanken_grotesk: "HankenGrotesk_400Regular",
};

const PREVIEW_ACTIONS: { icon: keyof typeof MaterialIcons.glyphMap; label: string }[] = [
  { icon: "refresh", label: "Refresh" },
  { icon: "settings", label: "Settings" },
  { icon: "bookmark", label: "Bookmark" },
  { icon: "share", label: "Share" },
];

function PreviewActionIcon({ icon, label }: { icon: keyof typeof MaterialIcons.glyphMap; label: string }) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="h-8 w-8 items-center justify-center rounded-full bg-surface-container"
    >
      <MaterialIcons name={icon} size={18} color="#44474d" />
    </View>
  );
}

export function WidgetPreview({ citation, fontStyle, loading = false }: WidgetPreviewProps) {
  return (
    <View className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-6">
      <View
        className="absolute -top-3 left-6 rounded-full bg-secondary-container px-3 py-1"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
      >
        <Text className="font-label-sm text-label-sm text-on-secondary-container">Live Preview</Text>
      </View>

      <View className="relative mt-4 rounded-lg border-l-2 border-secondary bg-surface-container-lowest p-8" style={shadowLevel1}>
        <View className="absolute right-2 top-2 opacity-20">
          <MaterialIcons name="flare" size={20} color="#735c00" />
        </View>

        {loading ? (
          <Text className="font-body-md text-body-md text-on-surface-variant">Loading preview…</Text>
        ) : citation ? (
          <>
            <Text
              className="mb-6 text-citation-xl leading-relaxed text-on-background"
              style={{ fontFamily: fontFamilyMap[fontStyle], fontStyle: fontStyle === "source_serif_4" ? "italic" : "normal" }}
            >
              "{citation.text}"
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="font-label-sm text-label-sm uppercase tracking-wider text-primary">
                {citation.sourceRef ?? citation.author ?? citation.sourceType}
              </Text>
              <View className="flex-row gap-2">
                {PREVIEW_ACTIONS.map((action) => (
                  <PreviewActionIcon key={action.icon} icon={action.icon} label={action.label} />
                ))}
              </View>
            </View>
            {citation.addedBy ? (
              <Text className="mt-3 text-sm text-on-surface-variant">Added by {citation.addedBy}</Text>
            ) : null}
          </>
        ) : (
          <Text className="font-body-md text-body-md text-on-surface-variant">No citations available for this selection.</Text>
        )}
      </View>
    </View>
  );
}
