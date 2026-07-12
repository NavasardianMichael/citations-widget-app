import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/button";
import { RadioListRow } from "@/components/radio-list-row";
import { RadioOptionCard } from "@/components/radio-option-card";
import { SelectField } from "@/components/select-field";
import { SettingsSection } from "@/components/settings-section";
import { ToggleRow } from "@/components/toggle-row";
import { TopAppBar } from "@/components/top-app-bar";
import { WidgetPreview } from "@/components/widget-preview";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { getWidgetSettings, previewWidgetCitation, saveWidgetSettings } from "@/services/widget-settings";
import type {
  FontStyle,
  RefreshRateHours,
  SourceSelection,
  WidgetCitation,
  WidgetSettingsDraft,
} from "@/types/citation";

const SOURCE_OPTIONS: { value: SourceSelection; label: string; icon: "church" | "auto-stories" | "all-inclusive" | "bookmark" }[] = [
  { value: "bible", label: "Bible", icon: "church" },
  { value: "fiction", label: "Fiction", icon: "auto-stories" },
  { value: "mixed", label: "Mixed", icon: "all-inclusive" },
  { value: "saved", label: "Saved", icon: "bookmark" },
];

const REFRESH_OPTIONS: { value: RefreshRateHours; label: string }[] = [
  { value: 6, label: "Every 6 hours" },
  { value: 12, label: "Every 12 hours" },
  { value: 24, label: "Daily" },
];

const FONT_OPTIONS: { value: FontStyle; label: string }[] = [
  { value: "source_serif_4", label: "Source Serif 4 (Classic)" },
  { value: "hanken_grotesk", label: "Hanken Grotesk (Modern)" },
];

export default function SettingsScreen() {
  const { isLg } = useBreakpoint();
  const [saved, setSaved] = useState<WidgetSettingsDraft | null>(null);
  const [draft, setDraft] = useState<WidgetSettingsDraft>({
    sourceSelection: "bible",
    refreshRateHours: 24,
    fontStyle: "source_serif_4",
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
      Alert.alert("Saved", "Widget settings have been saved.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    if (saved) setDraft(saved);
  }

  const settingsColumn = (
    <View className="gap-8">
      <SettingsSection title="Source Selection" icon="menu-book">
        <View className="flex-row flex-wrap gap-4">
          {SOURCE_OPTIONS.map((option) => (
            <RadioOptionCard
              key={option.value}
              label={option.label}
              icon={option.icon}
              selected={draft.sourceSelection === option.value}
              onPress={() => updateDraft("sourceSelection", option.value)}
            />
          ))}
        </View>
      </SettingsSection>

      <SettingsSection title="Refresh Rate" icon="update">
        <View className="gap-3">
          {REFRESH_OPTIONS.map((option) => (
            <RadioListRow
              key={option.value}
              label={option.label}
              selected={draft.refreshRateHours === option.value}
              onPress={() => updateDraft("refreshRateHours", option.value)}
            />
          ))}
        </View>
      </SettingsSection>

      <SettingsSection title="Typography" icon="format-size">
        <SelectField
          label="Font Style"
          options={FONT_OPTIONS}
          value={draft.fontStyle}
          onChange={(v) => updateDraft("fontStyle", v)}
        />
      </SettingsSection>

      <SettingsSection title="Display Options" icon="visibility">
        <ToggleRow
          title="Show attribution for community submissions"
          description='Displays "Added by [Name]" on the bottom of widgets'
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
        <Button label="Discard" variant="secondary" secondaryBorder="secondary" onPress={handleDiscard} />
        <Button
          label={saving ? "Saving…" : "Save Widget"}
          icon="save"
          onPress={handleSave}
          disabled={saving}
        />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <TopAppBar title="Configure Widget" />
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
