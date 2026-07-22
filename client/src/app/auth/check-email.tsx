import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { AuthStatusScreen } from "@/components/ui/auth-status-screen";
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
    <AuthStatusScreen
      icon="mark-email-read"
      title={t("auth.checkEmail.title")}
      body={t("auth.checkEmail.body", { email: email ?? "" })}
    >
      {error ? <Text className="text-center text-error">{error}</Text> : null}
      {message ? <Text className="text-center text-primary">{message}</Text> : null}
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
    </AuthStatusScreen>
  );
}
