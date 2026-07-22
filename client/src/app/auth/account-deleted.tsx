import { useRouter } from "expo-router";

import { AuthStatusScreen } from "@/components/ui/auth-status-screen";
import { Button } from "@/components/ui/button";
import { SkipAuthLink } from "@/components/ui/skip-auth-link";
import { t } from "@/i18n";

export default function AccountDeletedScreen() {
  const router = useRouter();

  return (
    <AuthStatusScreen
      icon="person-off"
      title={t("auth.accountDeleted.title")}
      body={t("auth.accountDeleted.body")}
    >
      <Button
        label={t("auth.accountDeleted.goLogin")}
        onPress={() => router.replace("/auth/login")}
      />
      <SkipAuthLink />
    </AuthStatusScreen>
  );
}
