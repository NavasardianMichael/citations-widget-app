import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SkipAuthLink } from "@/components/ui/skip-auth-link";
import { TextLink } from "@/components/ui/text-link";
import { t } from "@/i18n";
import { hasErrors, validateForgotPassword, type FieldErrors } from "@/lib/validation";
import { forgotPasswordRequest } from "@/services/auth-api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<"email">>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setMessage(null);
    const nextErrors = validateForgotPassword({ email });
    setFieldErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      const result = await forgotPasswordRequest(email.trim());
      setMessage(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.forgot.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-margin-mobile py-8 md:px-margin-desktop">
          <View className="mx-auto w-full max-w-md">
            <Text className="mb-2 font-display-lg text-display-lg-mobile text-primary">{t("auth.forgot.title")}</Text>
            <Text className="mb-8 font-body-md text-body-md text-on-surface-variant">{t("auth.forgot.subtitle")}</Text>

            {error ? <Text className="mb-4 text-error">{error}</Text> : null}
            {message ? <Text className="mb-4 text-primary">{message}</Text> : null}

            <FormField
              label={t("auth.login.email")}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="you@example.com"
              error={fieldErrors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Button
              label={loading ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
              onPress={handleSubmit}
              disabled={loading}
            />

            <TextLink href="/auth/login" replace variant="underline" align="center" className="mt-6">
              {t("auth.forgot.back")}
            </TextLink>

            <SkipAuthLink />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
