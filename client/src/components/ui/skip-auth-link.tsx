import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

import { pressableNoRipple } from "@/constants/pressable";
import { useAuth } from "@/contexts/auth-context";
import { t } from "@/i18n";

export function SkipAuthLink({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { continueAsGuest } = useAuth();

  async function handleSkip() {
    await continueAsGuest();
    router.replace("/(tabs)");
  }

  return (
    <Pressable {...pressableNoRipple} onPress={handleSkip} accessibilityRole="button" className={`mt-4 ${className}`}>
      <Text className="text-center font-body-md text-body-md text-on-surface-variant underline">
        {t("auth.skip")}
      </Text>
    </Pressable>
  );
}
