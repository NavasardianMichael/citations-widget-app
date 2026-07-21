import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { SkipAuthLink } from "@/components/ui/skip-auth-link";
import { TextLink } from "@/components/ui/text-link";
import { t } from "@/i18n";
import { resendVerificationRequest } from "@/services/auth-api";

export default function CheckEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    if (!email) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await resendVerificationRequest(email);
      setMessage(t("auth.checkEmail.resent"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.checkEmail.resendFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-grow justify-center px-margin-mobile py-8 md:px-margin-desktop">
        <View className="mx-auto w-full max-w-md items-center gap-8">
          <View className="items-center gap-4">
            <BrandLogo size={48} />
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MaterialIcons name="mark-email-read" size={36} color="#021a35" />
            </View>
            <Text className="text-center font-display-lg text-display-lg-mobile text-primary">
              {t("auth.checkEmail.title")}
            </Text>
            <Text className="text-center font-body-md text-body-md text-on-surface-variant">
              {t("auth.checkEmail.body", { email: email ?? "" })}
            </Text>
            {error ? <Text className="text-center text-error">{error}</Text> : null}
            {message ? <Text className="text-center text-primary">{message}</Text> : null}
          </View>

          <View className="w-full gap-4">
            {email ? (
              <Button
                label={loading ? t("auth.checkEmail.resending") : t("auth.checkEmail.resend")}
                onPress={handleResend}
                disabled={loading}
                variant="secondary"
              />
            ) : null}
            <Button label={t("auth.checkEmail.goLogin")} onPress={() => router.replace("/auth/login")} />
            <TextLink href="/auth/register" replace variant="underline" align="center">
              {t("auth.checkEmail.back")}
            </TextLink>
            <SkipAuthLink />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
