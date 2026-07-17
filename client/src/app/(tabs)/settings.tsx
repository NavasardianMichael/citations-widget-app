import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { RadioListRow } from "@/components/ui/radio-list-row";
import { RadioOptionCard } from "@/components/ui/radio-option-card";
import { SelectField } from "@/components/ui/select-field";
import { SettingsSection } from "@/components/ui/settings-section";
import { ToggleRow } from "@/components/ui/toggle-row";
import { TopAppBar } from "@/components/ui/top-app-bar";
import { WidgetPreview } from "@/components/widget-preview";
import { DEFAULT_WIDGET_FONT, WIDGET_FONT_OPTIONS } from "@/fonts/registry";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { t } from "@/i18n";
import { getWidgetSettings, previewWidgetCitation, saveWidgetSettings } from "@/services/widget-settings";
import type {
  RefreshRateHours,
  SourceSelection,
  WidgetCitation,
  WidgetSettingsDraft,
} from "@/types/citation";

const SOURCE_OPTIONS: { value: SourceSelection; labelKey: "settings.poolBible" | "settings.poolFiction" | "settings.poolMixed" | "settings.poolSaved"; icon: "church" | "auto-stories" | "all-inclusive" | "bookmark" }[] = [
  { value: "bible", labelKey: "settings.poolBible", icon: "church" },
  { value: "fiction", labelKey: "settings.poolFiction", icon: "auto-stories" },
  { value: "mixed", labelKey: "settings.poolMixed", icon: "all-inclusive" },
  { value: "saved", labelKey: "settings.poolSaved", icon: "bookmark" },
];

const REFRESH_OPTIONS: { value: RefreshRateHours; labelKey: "settings.refresh6" | "settings.refresh12" | "settings.refresh24" }[] = [
  { value: 6, labelKey: "settings.refresh6" },
  { value: 12, labelKey: "settings.refresh12" },
  { value: 24, labelKey: "settings.refresh24" },
];

const FONT_OPTIONS = WIDGET_FONT_OPTIONS.map((font) => ({
  value: font.id,
  label: font.label,
}));

export default function SettingsScreen() {
  const { isLg } = useBreakpoint();
  const [saved, setSaved] = useState<WidgetSettingsDraft | null>(null);
  const [draft, setDraft] = useState<WidgetSettingsDraft>({
    sourceSelection: "bible",
    refreshRateHours: 24,
    fontStyle: DEFAULT_WIDGET_FONT,
    showAttribution: true,
  });
  const [preview, setPreview] = useState<WidgetCitation | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    const settings = await getWidgetSettings();
    const next: WidgetSettingsDraft = {
      sourceSelection: settings.sourceSelection,
      refreshRateHours: settings.refreshRateHours,
      fontStyle: settings.fontStyle,
      showAttribution: settings.showAttribution,
    };
    setSaved(next);
    setDraft(next);
  }, []);

  useEffect(() => {
    loadSettings().catch(() => undefined);
  }, [loadSettings]);

  const refreshPreview = useCallback(async (nextDraft: WidgetSettingsDraft) => {
    setPreviewLoading(true);
    try {
      const result = await previewWidgetCitation({
        sourceSelection: nextDraft.sourceSelection,
        fontStyle: nextDraft.fontStyle,
        showAttribution: nextDraft.showAttribution,
      });
      setPreview(result.citation);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshPreview(draft);
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, refreshPreview]);

  function updateDraft<K extends keyof WidgetSettingsDraft>(key: K, value: WidgetSettingsDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await saveWidgetSettings(draft);
      const next: WidgetSettingsDraft = {
        sourceSelection: updated.sourceSelection,
        refreshRateHours: updated.refreshRateHours,
        fontStyle: updated.fontStyle,
        showAttribution: updated.showAttribution,
      };
      setSaved(next);
      setDraft(next);
      Alert.alert(t("common.save"), t("settings.saved"));
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    if (saved) setDraft(saved);
  }

  const settingsColumn = (
    <View className="gap-8">
      <SettingsSection title={t("settings.sourcePool")} icon="menu-book">
        <View className="flex-row flex-wrap gap-4">
          {SOURCE_OPTIONS.map((option) => (
            <RadioOptionCard
              key={option.value}
              label={t(option.labelKey)}
              icon={option.icon}
              selected={draft.sourceSelection === option.value}
              onPress={() => updateDraft("sourceSelection", option.value)}
            />
          ))}
        </View>
      </SettingsSection>

      <SettingsSection title={t("settings.refreshRate")} icon="update">
        <View className="gap-3">
          {REFRESH_OPTIONS.map((option) => (
            <RadioListRow
              key={option.value}
              label={t(option.labelKey)}
              selected={draft.refreshRateHours === option.value}
              onPress={() => updateDraft("refreshRateHours", option.value)}
            />
          ))}
        </View>
      </SettingsSection>

      <SettingsSection title={t("settings.typography")} icon="format-size">
        <SelectField
          label={t("settings.font")}
          options={FONT_OPTIONS}
          value={draft.fontStyle}
          onChange={(v) => updateDraft("fontStyle", v)}
        />
      </SettingsSection>

      <SettingsSection title={t("settings.displayOptions")} icon="visibility">
        <ToggleRow
          title={t("settings.attribution")}
          description={t("settings.attributionDesc")}
          value={draft.showAttribution}
          onValueChange={(v) => updateDraft("showAttribution", v)}
        />
      </SettingsSection>
    </View>
  );

  const previewColumn = (
    <View>
      <WidgetPreview citation={preview} fontStyle={draft.fontStyle} loading={previewLoading} />
      <View className="mt-8 flex-row justify-end gap-4">
        <Button label={t("common.discard")} variant="secondary" secondaryBorder="secondary" onPress={handleDiscard} />
        <Button
          label={saving ? t("common.saving") : t("settings.save")}
          icon="save"
          onPress={handleSave}
          disabled={saving}
        />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <TopAppBar title={t("settings.title")} />
      <ScrollView className="flex-1" contentContainerClassName="pb-28 md:pb-12">
        <View className="mx-auto w-full max-w-[1200px] px-margin-mobile py-8 md:px-margin-desktop md:py-12">
          {isLg ? (
            <View className="flex-row items-start gap-gutter">
              <View className="w-7/12">{settingsColumn}</View>
              <View className="w-5/12">{previewColumn}</View>
            </View>
          ) : (
            <View className="gap-8">
              {settingsColumn}
              {previewColumn}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
