import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandLogo } from "@/components/ui/brand-logo";

type TopAppBarProps = {
  title: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  showBrandIcon?: boolean;
};

export function TopAppBar({ title, leftAction, rightAction, showBrandIcon = false }: TopAppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="sticky top-0 z-50 w-full shrink-0 flex-row items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile py-3 md:px-margin-desktop"
      style={{ marginTop: insets.top, minHeight: 64 }}
    >
      <View className="min-w-10 w-10 shrink-0 flex-row items-center self-center">
        {leftAction ?? (showBrandIcon ? <BrandLogo size={28} /> : null)}
      </View>
      <Text
        className="mx-2 min-w-0 flex-1 text-center font-headline-md text-headline-md text-primary"
        style={{ flexShrink: 1 }}
      >
        {title}
      </Text>
      <View className="min-w-10 w-10 shrink-0 flex-row items-center justify-end self-center">
        {rightAction}
      </View>
    </View>
  );
}
