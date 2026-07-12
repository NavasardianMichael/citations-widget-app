import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { FormField } from "@/components/form-field";
import { pressableNoRipple } from "@/constants/pressable";
import { useAuth } from "@/contexts/auth-context";
import { AuthApiError } from "@/services/auth-api";
import { useGoogleSignIn } from "@/services/google-auth";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, setUser } = useAuth();
  const { signInWithGoogle, request, isConfigured } = useGoogleSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(forceLogin = false) {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password, forceLogin);
      router.replace("/(tabs)");
    } catch (e) {
      if (e instanceof AuthApiError && e.code === "SESSION_LIMIT_REACHED" && !forceLogin) {
        setError("Account active on too many devices. Tap below to sign out other devices.");
      } else {
        setError(e instanceof Error ? e.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin(forceLogin = false) {
    setError(null);
    setLoading(true);
    try {
      const data = await signInWithGoogle(forceLogin);
      if (!data) return;
      setUser(data.user);
      router.replace("/(tabs)");
    } catch (e) {
      if (e instanceof AuthApiError && e.code === "SESSION_LIMIT_REACHED" && !forceLogin) {
        setError("Account active on too many devices. Try Google sign-in again to replace other sessions.");
      } else {
        setError(e instanceof Error ? e.message : "Google sign-in failed");
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
            <Text className="mb-2 font-display-lg text-display-lg-mobile text-primary">Welcome back</Text>
            <Text className="mb-8 font-body-md text-body-md text-on-surface-variant">Sign in to access your citations and widget settings.</Text>

            {error ? <Text className="mb-4 text-error">{error}</Text> : null}

            <FormField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" />
            <FormField label="Password" value={password} onChangeText={setPassword} placeholder="Your password" />

            <Pressable {...pressableNoRipple} onPress={() => router.push("/auth/forgot-password")} className="mb-6">
              <Text className="text-right font-label-md text-label-md text-primary">Forgot password?</Text>
            </Pressable>

            <Button label={loading ? "Signing in..." : "Sign in"} onPress={() => handleLogin()} disabled={loading} />

            {isConfigured ? (
              <Button
                label="Continue with Google"
                variant="secondary"
                onPress={() => handleGoogleLogin()}
                disabled={loading || !request}
                className="mt-3"
              />
            ) : null}

            {error?.includes("too many devices") ? (
              <Button
                label="Sign out other devices and continue"
                variant="ghost"
                onPress={() => handleLogin(true)}
                disabled={loading}
                className="mt-3"
              />
            ) : null}

            <Pressable {...pressableNoRipple} onPress={() => router.push("/auth/register")} className="mt-6">
              <Text className="text-center font-body-md text-body-md text-on-surface-variant">
                No account? <Text className="text-primary">Create one</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
