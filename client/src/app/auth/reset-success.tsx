import { useRouter } from "expo-router";

import { AuthStatusScreen } from "@/components/ui/auth-status-screen";
import { Button } from "@/components/ui/button";
import { SkipAuthLink } from "@/components/ui/skip-auth-link";
import { t } from "@/i18n";

export default function ResetSuccessScreen() {
  const router = useRouter();

  return (
    <AuthStatusScreen
      icon="lock"
      title={t("auth.resetSuccess.title")}
      body={t("auth.resetSuccess.body")}
    >
      <Button label={t("auth.resetSuccess.goLogin")} onPress={() => router.replace("/auth/login")} />
      <SkipAuthLink />
    </AuthStatusScreen>
  );
}
