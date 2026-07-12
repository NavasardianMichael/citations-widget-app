import { type Href } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from "expo-router/ui";
import { Pressable, Text, View } from "react-native";

import { useBreakpoint } from "@/hooks/use-breakpoint";
import { pressableNoRipple } from "@/constants/pressable";

const TABS: { name: string; href: Href; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { name: "index", href: "/", label: "Saved", icon: "bookmark" },
  { name: "submit", href: "/submit", label: "Submit", icon: "edit" },
  { name: "settings", href: "/settings", label: "Settings", icon: "settings" },
  { name: "profile", href: "/profile", label: "Profile", icon: "person" },
];

export default function AppTabs() {
  const { isMd } = useBreakpoint();

  if (isMd) {
    return (
      <Tabs>
        <View className="min-h-screen flex-1 flex-row bg-background">
          <TabList asChild>
            <View className="w-56 shrink-0 border-r border-outline-variant bg-surface px-4 py-8">
              <Text className="mb-8 px-3 font-headline-md text-headline-md text-primary">Digital Sanctuary</Text>
              {TABS.map((tab) => (
                <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
                  <SidebarTab icon={tab.icon} label={tab.label} />
                </TabTrigger>
              ))}
            </View>
          </TabList>
          <View className="flex-1">
            <TabSlot style={{ flex: 1, height: "100%" }} />
          </View>
        </View>
      </Tabs>
    );
  }

  return (
    <Tabs>
      <TabSlot style={{ flex: 1, paddingBottom: 72 }} />
      <TabList asChild>
        <View className="fixed bottom-0 left-0 right-0 z-50 flex-row items-center justify-between border-t border-outline-variant bg-surface px-margin-mobile py-2">
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <BottomTab icon={tab.icon} label={tab.label} />
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  );
}

function SidebarTab({
  icon,
  label,
  isFocused,
  ...props
}: TabTriggerSlotProps & { icon: keyof typeof MaterialIcons.glyphMap; label: string }) {
  return (
    <Pressable
      {...pressableNoRipple}
      {...props}
      className={`mb-1 flex-row items-center gap-3 rounded-lg px-3 py-3 ${isFocused ? "bg-primary-fixed" : ""}`}
      accessibilityRole="tab"
    >
      <MaterialIcons name={icon} size={20} color={isFocused ? "#021a35" : "#44474d"} />
      <Text className={`font-body-md text-body-md ${isFocused ? "text-primary" : "text-on-surface-variant"}`}>{label}</Text>
    </Pressable>
  );
}

function BottomTab({
  icon,
  label,
  isFocused,
  ...props
}: TabTriggerSlotProps & { icon: keyof typeof MaterialIcons.glyphMap; label: string }) {
  const color = isFocused ? "#021a35" : "#44474d";
  return (
    <Pressable {...pressableNoRipple} {...props} className="min-h-11 flex-1 items-center justify-center gap-1" accessibilityRole="tab">
      <MaterialIcons name={icon} size={22} color={color} />
      <Text className="font-label-sm text-label-sm" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}
