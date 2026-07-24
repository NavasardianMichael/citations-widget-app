import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { FormField } from "@/components/ui/form-field";
import { TogglePill } from "@/components/ui/toggle-pill";
import { ToggleRow } from "@/components/ui/toggle-row";
import { t } from "@/i18n";
import type { CitationCategory } from "@/types/citation";

export type CitationFormValues = {
  text: string;
  source: string;
  category: CitationCategory;
  shareProfile: boolean;
};

export const emptyCitationFormValues = (): CitationFormValues => ({
  text: "",
  source: "",
  category: "bible",
  shareProfile: true,
});

export const citationToFormValues = (citation: {
  text: string;
  source: string;
  category: CitationCategory;
  shareProfile: boolean;
}): CitationFormValues => ({
  text: citation.text,
  source: citation.source,
  category: citation.category,
  shareProfile: citation.shareProfile,
});

type CitationFormProps = {
  values: CitationFormValues;
  onChange: (values: CitationFormValues) => void;
  footer?: ReactNode;
  disabled?: boolean;
  errors?: Partial<Record<"text" | "source", string>>;
};

export function CitationForm({ values, onChange, footer, disabled = false, errors }: CitationFormProps) {
  function patch<K extends keyof CitationFormValues>(key: K, value: CitationFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <View
      className="gap-8 rounded-xl bg-surface-container-low p-6 md:p-10"
      style={{ boxShadow: "0 4px 20px rgba(2, 26, 53, 0.15)" }}
    >
      <FormField
        label={t("form.citationText")}
        value={values.text}
        onChangeText={(text) => patch("text", text)}
        placeholder={t("form.citationPlaceholder")}
        multiline
        variant="paper"
        editable={!disabled}
        error={errors?.text}
      />

      <FormField
        label={t("form.source")}
        value={values.source}
        onChangeText={(source) => patch("source", source)}
        placeholder={t("form.sourcePlaceholder")}
        variant="paper"
        editable={!disabled}
        error={errors?.source}
      />

      <View className="gap-2">
        <Text className="font-label-sm text-label-sm text-primary">{t("form.category")}</Text>
        <TogglePill
          variant="category"
          options={[
            { value: "bible" as const, label: t("form.categoryBible") },
            { value: "fiction" as const, label: t("form.categoryFiction") },
          ]}
          value={values.category}
          onChange={(category) => patch("category", category)}
          disabled={disabled}
        />
      </View>

      <ToggleRow
        title={t("form.shareProfile")}
        description={t("form.shareProfileDetail")}
        value={values.shareProfile}
        onValueChange={(shareProfile) => patch("shareProfile", shareProfile)}
        disabled={disabled}
      />

      {footer ? <View className="border-t border-outline-variant/30 pt-6">{footer}</View> : null}
    </View>
  );
}
