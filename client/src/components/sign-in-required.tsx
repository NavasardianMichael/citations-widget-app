import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { t } from "@/i18n";

export function SignInRequired() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-margin-mobile py-12">
      <Text className="text-center font-headline-md text-headline-md text-primary">
        {t("guest.signInRequiredTitle")}
      </Text>
      <Text className="max-w-md text-center font-body-md text-body-md text-on-surface-variant">
        {t("guest.signInRequiredBody")}
      </Text>
      <Button label={t("guest.signIn")} onPress={() => router.push("/auth/login")} />
    </View>
  );
}
