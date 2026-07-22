import { useLocalSearchParams, useRouter } from "expo-router";

import { AuthStatusScreen } from "@/components/ui/auth-status-screen";
import { Button } from "@/components/ui/button";
import { SkipAuthLink } from "@/components/ui/skip-auth-link";
import { TextLink } from "@/components/ui/text-link";
import { t } from "@/i18n";

export default function ForgotPasswordSentScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <AuthStatusScreen
      icon="mark-email-read"
      title={t("auth.forgotSent.title")}
      body={t("auth.forgotSent.body", { email: email ?? "" })}
    >
      <Button label={t("auth.forgotSent.goLogin")} onPress={() => router.replace("/auth/login")} />
      <TextLink href="/auth/forgot-password" replace variant="underline" align="center">
        {t("auth.forgotSent.back")}
      </TextLink>
      <SkipAuthLink />
    </AuthStatusScreen>
  );
}
