import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { FormField } from "@/components/form-field";
import { pressableNoRipple } from "@/constants/pressable";
import { useAuth } from "@/contexts/auth-context";
import { t } from "@/i18n";

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    setMessage(null);
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
          <View className="mx-auto w-full max-w-md">
            <Text className="mb-2 font-display-lg text-display-lg-mobile text-primary">{t("auth.register.title")}</Text>
            <Text className="mb-8 font-body-md text-body-md text-on-surface-variant">{t("auth.register.subtitle")}</Text>

            {error ? <Text className="mb-4 text-error">{error}</Text> : null}
            {message ? <Text className="mb-4 text-primary">{message}</Text> : null}

            <FormField
              label={t("auth.register.name")}
              value={name}
              onChangeText={setName}
              placeholder={t("auth.register.namePlaceholder")}
            />
            <FormField label={t("auth.login.email")} value={email} onChangeText={setEmail} placeholder="you@example.com" />
            <FormField
              label={t("auth.login.password")}
              value={password}
              onChangeText={setPassword}
              placeholder={t("auth.register.passwordPlaceholder")}
            />

            <Button
              label={loading ? t("auth.register.submitting") : t("auth.register.submit")}
              onPress={handleRegister}
              disabled={loading}
            />

            <Pressable {...pressableNoRipple} onPress={() => router.replace("/auth/login")} className="mt-6">
              <Text className="text-center font-body-md text-body-md text-on-surface-variant">
                {t("auth.register.hasAccount")} <Text className="text-primary">{t("auth.register.signIn")}</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
