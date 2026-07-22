import { useRouter } from "expo-router";

import { AuthStatusScreen } from "@/components/ui/auth-status-screen";
import { Button } from "@/components/ui/button";
import { SkipAuthLink } from "@/components/ui/skip-auth-link";
import { t } from "@/i18n";

export default function LoggedOutScreen() {
  const router = useRouter();

  return (
    <AuthStatusScreen
      icon="logout"
      title={t("auth.loggedOut.title")}
      body={t("auth.loggedOut.body")}
    >
      <Button label={t("auth.loggedOut.goLogin")} onPress={() => router.replace("/auth/login")} />
      <SkipAuthLink />
    </AuthStatusScreen>
  );
}
