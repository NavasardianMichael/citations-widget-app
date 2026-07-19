import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SkipAuthLink } from "@/components/ui/skip-auth-link";
import { t } from "@/i18n";
import { hasErrors, validateResetPassword, type FieldErrors } from "@/lib/validation";
import { resetPasswordRequest } from "@/services/auth-api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<"password" | "confirmPassword">>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setError(t("auth.reset.invalidLink"));
  }, [token]);

  async function handleSubmit() {
    if (!token) return;
    setError(null);
    setMessage(null);
    const nextErrors = validateResetPassword({ password, confirmPassword });
    setFieldErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      const result = await resetPasswordRequest(token, password);
      setMessage(result.message);
      setTimeout(() => router.replace("/auth/login"), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.reset.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-margin-mobile py-8 md:px-margin-desktop">
          <View className="mx-auto w-full max-w-md gap-8">
            <View className="gap-2">
              <BrandLogo size={48} className="mb-2" />
              <Text className="font-display-lg text-display-lg-mobile text-primary">{t("auth.reset.title")}</Text>
              <Text className="font-body-md text-body-md text-on-surface-variant">{t("auth.reset.subtitle")}</Text>
            </View>

            <View className="gap-6">
              {error ? <Text className="text-error">{error}</Text> : null}
              {message ? <Text className="text-primary">{message}</Text> : null}

              <FormField
                label={t("auth.reset.newPassword")}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (fieldErrors.password || fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      password: undefined,
                      confirmPassword: undefined,
                    }));
                  }
                }}
                placeholder={t("auth.register.passwordPlaceholder")}
                error={fieldErrors.password}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <FormField
                label={t("auth.reset.confirmPassword")}
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                placeholder={t("auth.reset.confirmPasswordPlaceholder")}
                error={fieldErrors.confirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <Button
                label={loading ? t("auth.reset.submitting") : t("auth.reset.submit")}
                onPress={handleSubmit}
                disabled={loading || !token}
              />
            </View>

            <View className="gap-4">
              <SkipAuthLink />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
