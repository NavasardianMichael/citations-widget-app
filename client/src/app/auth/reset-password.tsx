import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { FormField } from "@/components/form-field";
import { resetPasswordRequest } from "@/services/auth-api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setError("Invalid reset link. Request a new one from the app.");
  }, [token]);

  async function handleSubmit() {
    if (!token) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const result = await resetPasswordRequest(token, password);
      setMessage(result.message);
      setTimeout(() => router.replace("/auth/login"), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-margin-mobile py-8 md:px-margin-desktop">
          <View className="mx-auto w-full max-w-md">
            <Text className="mb-2 font-display-lg text-display-lg-mobile text-primary">Set new password</Text>
            <Text className="mb-8 font-body-md text-body-md text-on-surface-variant">Choose a strong password for your account.</Text>

            {error ? <Text className="mb-4 text-error">{error}</Text> : null}
            {message ? <Text className="mb-4 text-primary">{message}</Text> : null}

            <FormField label="New password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" />
            <Button label={loading ? "Saving..." : "Update password"} onPress={handleSubmit} disabled={loading || !token} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
