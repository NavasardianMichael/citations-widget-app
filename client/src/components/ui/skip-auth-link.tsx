import { useRouter } from "expo-router";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { t } from "@/i18n";

export function SkipAuthLink({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { continueAsGuest } = useAuth();

  async function handleSkip() {
    await continueAsGuest();
    router.replace("/(tabs)");
  }

  return <Button label={t("auth.skip")} variant="secondary" onPress={handleSkip} className={className} />;
}
