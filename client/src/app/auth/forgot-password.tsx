import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { FormField } from "@/components/form-field";
import { pressableNoRipple } from "@/constants/pressable";
import { forgotPasswordRequest } from "@/services/auth-api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const result = await forgotPasswordRequest(email.trim());
      setMessage(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-margin-mobile py-8 md:px-margin-desktop">
          <View className="mx-auto w-full max-w-md">
            <Text className="mb-2 font-display-lg text-display-lg-mobile text-primary">Reset password</Text>
            <Text className="mb-8 font-body-md text-body-md text-on-surface-variant">Enter your email and we will send a reset link to the app.</Text>

            {error ? <Text className="mb-4 text-error">{error}</Text> : null}
            {message ? <Text className="mb-4 text-primary">{message}</Text> : null}

            <FormField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" />
            <Button label={loading ? "Sending..." : "Send reset link"} onPress={handleSubmit} disabled={loading} />

            <Pressable {...pressableNoRipple} onPress={() => router.replace("/auth/login")} className="mt-6">
              <Text className="text-center font-body-md text-body-md text-primary">Back to sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
