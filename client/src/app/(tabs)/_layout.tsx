import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabsLayout() {
  return (
    <NativeTabs backgroundColor="#fbf9f8" indicatorColor="#d4e3ff" labelStyle={{ selected: { color: "#021a35" } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="bookmark" sf="bookmark" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="submit">
        <NativeTabs.Trigger.Label>Submit</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="edit" sf="square.and.pencil" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="settings" sf="gearshape" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="person" sf="person.crop.circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
