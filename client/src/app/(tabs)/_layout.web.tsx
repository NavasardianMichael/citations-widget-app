import { type Href } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from "expo-router/ui";
import { Pressable, Text, View } from "react-native";

import { BrandLogo } from "@/components/ui/brand-logo";
import { pressableNoRipple } from "@/constants/pressable";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { t } from "@/i18n";

const TABS: { name: string; href: Href; labelKey: "tabs.saved" | "tabs.submit" | "tabs.settings" | "tabs.profile"; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { name: "index", href: "/", labelKey: "tabs.saved", icon: "bookmark" },
  { name: "submit", href: "/submit", labelKey: "tabs.submit", icon: "edit" },
  { name: "settings", href: "/settings", labelKey: "tabs.settings", icon: "settings" },
  { name: "profile", href: "/profile", labelKey: "tabs.profile", icon: "person" },
];

export default function TabsLayout() {
  const { isMd } = useBreakpoint();

  if (isMd) {
    return (
      <Tabs>
        <View className="min-h-screen flex-1 flex-row bg-background">
          <TabList asChild>
            <View className="w-56 shrink-0 gap-8 border-r border-outline-variant bg-surface px-4 py-8">
              <View className="flex-row items-center gap-2 px-3">
                <BrandLogo size={32} />
                <Text className="font-headline-md text-headline-md text-primary">{t("common.brand")}</Text>
              </View>
              <View className="gap-1">
                {TABS.map((tab) => (
                  <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
                    <SidebarTab icon={tab.icon} label={t(tab.labelKey)} />
                  </TabTrigger>
                ))}
              </View>
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
              <BottomTab icon={tab.icon} label={t(tab.labelKey)} />
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
      className={`flex-row items-center gap-3 rounded-lg px-3 py-3 ${isFocused ? "bg-primary-fixed" : ""}`}
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
