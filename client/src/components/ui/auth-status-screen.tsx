import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandLogo } from "@/components/ui/brand-logo";

type AuthStatusScreenProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  body: string;
  children?: ReactNode;
};

/** Centered auth outcome screen (email sent, logout, account deleted, etc.). */
export function AuthStatusScreen({ icon, title, body, children }: AuthStatusScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-grow justify-center px-margin-mobile py-8 md:px-margin-desktop">
        <View className="mx-auto w-full max-w-md items-center gap-8">
          <View className="items-center gap-4">
            <BrandLogo size={48} />
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MaterialIcons name={icon} size={36} color="#021a35" />
            </View>
            <Text className="text-center font-display-lg text-display-lg-mobile text-primary">{title}</Text>
            <Text className="text-center font-body-md text-body-md text-on-surface-variant">{body}</Text>
          </View>

          {children ? <View className="w-full gap-4">{children}</View> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
