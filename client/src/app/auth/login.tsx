import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SkipAuthLink } from "@/components/ui/skip-auth-link";
import { TextLink } from "@/components/ui/text-link";
import { pressableNoRipple } from "@/constants/pressable";
import { useAuth } from "@/contexts/auth-context";
import { t } from "@/i18n";
import { hasErrors, validateLogin, type FieldErrors } from "@/lib/validation";
import { AuthApiError } from "@/services/auth-api";
import { useGoogleSignIn } from "@/services/google-auth";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, setUser, completeGuestSignIn } = useAuth();
  const { signInWithGoogle, request, isConfigured } = useGoogleSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<"email" | "password">>({});
  const [error, setError] = useState<string | null>(null);
  const [sessionLimitReached, setSessionLimitReached] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(forceLogin = false) {
    setError(null);
    setSessionLimitReached(false);
    const nextErrors = validateLogin({ email, password });
    setFieldErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      await signIn(email.trim(), password, forceLogin);
      router.replace("/(tabs)");
    } catch (e) {
      if (e instanceof AuthApiError && e.code === "SESSION_LIMIT_REACHED" && !forceLogin) {
        setSessionLimitReached(true);
        setError(t("auth.login.sessionLimit"));
      } else {
        setError(e instanceof Error ? e.message : t("auth.login.failed"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin(forceLogin = false) {
    setError(null);
    setFieldErrors({});
    setSessionLimitReached(false);
    setLoading(true);
    try {
      const data = await signInWithGoogle(forceLogin);
      if (!data) return;
      setUser(data.user);
      await completeGuestSignIn();
      router.replace("/(tabs)");
    } catch (e) {
      if (e instanceof AuthApiError && e.code === "SESSION_LIMIT_REACHED" && !forceLogin) {
        setSessionLimitReached(true);
        setError(t("auth.login.sessionLimitGoogle"));
      } else {
        setError(e instanceof Error ? e.message : t("auth.login.googleFailed"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-margin-mobile py-8 md:px-margin-desktop">
          <View className="mx-auto w-full max-w-md">
            <Text className="mb-2 font-display-lg text-display-lg-mobile text-primary">{t("auth.login.title")}</Text>
            <Text className="mb-8 font-body-md text-body-md text-on-surface-variant">{t("auth.login.subtitle")}</Text>

            {error ? <Text className="mb-4 text-error">{error}</Text> : null}

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
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder={t("auth.login.passwordPlaceholder")}
              error={fieldErrors.password}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
            />

            <TextLink href="/auth/forgot-password" variant="underline" align="right" className="mb-6">
              {t("auth.login.forgot")}
            </TextLink>

            <Button
              label={loading ? t("auth.login.submitting") : t("auth.login.submit")}
              onPress={() => handleLogin()}
              disabled={loading}
            />

            {isConfigured ? (
              <Button
                label={t("auth.login.google")}
                variant="secondary"
                onPress={() => handleGoogleLogin()}
                disabled={loading || !request}
                className="mt-3"
              />
            ) : null}

            {sessionLimitReached ? (
              <Button
                label={t("auth.login.forceDevices")}
                variant="ghost"
                onPress={() => handleLogin(true)}
                disabled={loading}
                className="mt-3"
              />
            ) : null}

            <Link href="/auth/register" asChild>
              <Pressable {...pressableNoRipple} accessibilityRole="link" className="mt-6">
                <Text className="text-center font-body-md text-body-md text-on-surface-variant">
                  {t("auth.login.noAccount")}{" "}
                  <Text className="text-primary underline">{t("auth.login.createOne")}</Text>
                </Text>
              </Pressable>
            </Link>

            <SkipAuthLink />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
