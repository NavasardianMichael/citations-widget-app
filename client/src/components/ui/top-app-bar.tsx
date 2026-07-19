import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { BrandLogo } from "@/components/ui/brand-logo";

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
        {leftAction ?? (showBrandIcon ? <BrandLogo size={28} /> : null)}
      </View>
      <Text className="flex-2 text-center font-headline-md text-headline-md text-primary" numberOfLines={1}>
        {title}
      </Text>
      <View className="min-w-10 flex-1 flex-row items-center justify-end">{rightAction}</View>
    </View>
  );
}
