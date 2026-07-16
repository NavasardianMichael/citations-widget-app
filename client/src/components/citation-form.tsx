import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { FormField } from "@/components/form-field";
import { TogglePill } from "@/components/toggle-pill";
import { ToggleRow } from "@/components/toggle-row";
import { t } from "@/i18n";
import type { CitationCategory } from "@/types/citation";

export type CitationFormValues = {
  text: string;
  author: string;
  source: string;
  category: CitationCategory;
  shareProfile: boolean;
};

export const emptyCitationFormValues = (): CitationFormValues => ({
  text: "",
  author: "",
  source: "",
  category: "bible",
  shareProfile: true,
});

export const citationToFormValues = (citation: {
  text: string;
  author: string | null;
  source: string | null;
  category: CitationCategory;
  shareProfile: boolean;
}): CitationFormValues => ({
  text: citation.text,
  author: citation.author ?? "",
  source: citation.source ?? "",
  category: citation.category,
  shareProfile: citation.shareProfile,
});

type CitationFormProps = {
  values: CitationFormValues;
  onChange: (values: CitationFormValues) => void;
  footer?: ReactNode;
  disabled?: boolean;
  errors?: Partial<Record<"text" | "author" | "source", string>>;
};

export function CitationForm({ values, onChange, footer, disabled = false, errors }: CitationFormProps) {
  function patch<K extends keyof CitationFormValues>(key: K, value: CitationFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <View
      className="rounded-xl bg-surface-container-low p-6 md:p-10"
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

      <View className="mb-8 flex-col gap-8 md:flex-row">
        <View className="flex-1">
          <FormField
            label={t("form.author")}
            value={values.author}
            onChangeText={(author) => patch("author", author)}
            placeholder={t("form.authorPlaceholder")}
            variant="paper"
            editable={!disabled}
            optional
            error={errors?.author}
          />
        </View>
        <View className="flex-1">
          <FormField
            label={t("form.source")}
            value={values.source}
            onChangeText={(source) => patch("source", source)}
            placeholder={t("form.sourcePlaceholder")}
            variant="paper"
            editable={!disabled}
            optional
            error={errors?.source}
          />
        </View>
      </View>

      <View className="mb-8">
        <Text className="mb-3 font-label-sm text-label-sm text-primary">{t("form.category")}</Text>
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

      <View className={footer ? "mb-10" : ""}>
        <ToggleRow
          title={t("form.shareProfile")}
          value={values.shareProfile}
          onValueChange={(shareProfile) => patch("shareProfile", shareProfile)}
          disabled={disabled}
        />
      </View>

      {footer ? <View className="border-t border-outline-variant/30 pt-6">{footer}</View> : null}
    </View>
  );
}
