import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { SkipAuthLink } from "@/components/ui/skip-auth-link";
import { t } from "@/i18n";
import { verifyEmailRequest } from "@/services/auth-api";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError(t("auth.verify.invalidLink"));
        setLoading(false);
        return;
      }
      try {
        const result = await verifyEmailRequest(token);
        setMessage(result.message);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("auth.verify.failed"));
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [token]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-grow justify-center px-margin-mobile py-8 md:px-margin-desktop">
        <View className="mx-auto w-full max-w-md items-center gap-8">
          <View className="items-center gap-4">
            <BrandLogo size={48} />
            <Text className="font-display-lg text-display-lg-mobile text-primary">{t("auth.verify.title")}</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#021a35" />
            ) : error ? (
              <Text className="text-center text-error">{error}</Text>
            ) : (
              <Text className="text-center font-body-md text-body-md text-primary">{message}</Text>
            )}
          </View>

          <View className="items-center gap-4">
            <Button label={t("auth.verify.goLogin")} onPress={() => router.replace("/auth/login")} />
            <SkipAuthLink />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
