import { NativeTabs } from "expo-router/unstable-native-tabs";

import { t } from "@/i18n";

export default function TabsLayout() {
  return (
    <NativeTabs
      backgroundColor="#fbf9f8"
      indicatorColor="#d4e3ff"
      labelVisibilityMode="labeled"
      labelStyle={{ default: { color: "#44474d" }, selected: { color: "#021a35" } }}
      iconColor={{ default: "#44474d", selected: "#021a35" }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t("tabs.saved")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="bookmark" sf="bookmark" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="submit">
        <NativeTabs.Trigger.Label>{t("tabs.submit")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="edit" sf="square.and.pencil" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t("tabs.settings")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="settings" sf="gearshape" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t("tabs.profile")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="person" sf="person.crop.circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
