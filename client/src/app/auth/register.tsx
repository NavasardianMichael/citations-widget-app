import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SkipAuthLink } from "@/components/ui/skip-auth-link";
import { pressableNoRipple } from "@/constants/pressable";
import { useAuth } from "@/contexts/auth-context";
import { t } from "@/i18n";
import { hasErrors, validateRegister, type FieldErrors } from "@/lib/validation";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<"name" | "email" | "password" | "confirmPassword">
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    setMessage(null);
    const nextErrors = validateRegister({ name, email, password, confirmPassword });
    setFieldErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, name.trim());
      setMessage(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.register.failed"));
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
              <Text className="font-display-lg text-display-lg-mobile text-primary">{t("auth.register.title")}</Text>
              <Text className="font-body-md text-body-md text-on-surface-variant">{t("auth.register.subtitle")}</Text>
            </View>

            <View className="gap-6">
              {error ? <Text className="text-error">{error}</Text> : null}
              {message ? <Text className="text-primary">{message}</Text> : null}

              <FormField
                label={t("auth.register.name")}
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder={t("auth.register.namePlaceholder")}
                error={fieldErrors.name}
                autoCapitalize="words"
                textContentType="name"
                autoComplete="name"
              />
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
              <FormField
                label={t("auth.login.password")}
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
                label={t("auth.register.confirmPassword")}
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                placeholder={t("auth.register.confirmPasswordPlaceholder")}
                error={fieldErrors.confirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />

              <Button
                label={loading ? t("auth.register.submitting") : t("auth.register.submit")}
                onPress={handleRegister}
                disabled={loading}
              />
            </View>

            <View className="gap-4">
              <View className="flex-row flex-wrap justify-center gap-1">
                <Text className="font-body-md text-body-md text-on-surface-variant">
                  {t("auth.register.hasAccount")}
                </Text>
                <Link href="/auth/login" replace asChild>
                  <Pressable {...pressableNoRipple} accessibilityRole="link">
                    <Text className="font-body-md text-body-md text-primary underline">{t("auth.register.signIn")}</Text>
                  </Pressable>
                </Link>
              </View>

              <SkipAuthLink />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
