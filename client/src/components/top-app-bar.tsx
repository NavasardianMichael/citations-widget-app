import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type TopAppBarProps = {
  title: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  showBrandIcon?: boolean;
};

export function TopAppBar({ title, leftAction, rightAction, showBrandIcon = false }: TopAppBarProps) {
  return (
    <View className="sticky top-0 z-50 h-16 w-full shrink-0 flex-row items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-margin-desktop">
      <View className="min-w-10 flex-1 flex-row items-center">
        {leftAction ??
          (showBrandIcon ? (
            <MaterialIcons name="menu-book" size={24} color="#021a35" accessibilityLabel="Digital Sanctuary" />
          ) : null)}
      </View>
      <Text className="flex-2 text-center font-headline-md text-headline-md text-primary" numberOfLines={1}>
        {title}
      </Text>
      <View className="min-w-10 flex-1 flex-row items-center justify-end">{rightAction}</View>
    </View>
  );
}
