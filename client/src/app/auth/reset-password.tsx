import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<"password">>({});
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
    const nextErrors = validateResetPassword({ password });
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
          <View className="mx-auto w-full max-w-md">
            <Text className="mb-2 font-display-lg text-display-lg-mobile text-primary">{t("auth.reset.title")}</Text>
            <Text className="mb-8 font-body-md text-body-md text-on-surface-variant">{t("auth.reset.subtitle")}</Text>

            {error ? <Text className="mb-4 text-error">{error}</Text> : null}
            {message ? <Text className="mb-4 text-primary">{message}</Text> : null}

            <FormField
              label={t("auth.reset.newPassword")}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder={t("auth.register.passwordPlaceholder")}
              error={fieldErrors.password}
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

            <SkipAuthLink />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
