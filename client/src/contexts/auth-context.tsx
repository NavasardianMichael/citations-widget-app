import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Href } from "expo-router";

import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
} from "@/services/auth-api";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/services/auth-storage";
import { migrateGuestDataToAccount } from "@/services/guest-migration";
import { isGuestMode, setGuestMode } from "@/services/local-storage";
import type { UserPublic } from "@/types/auth";

type AuthContextValue = {
  user: UserPublic | null;
  isGuest: boolean;
  isLoading: boolean;
  /** One-shot post-sign-out route; consumed by the root auth gate. */
  pendingAuthRoute: Href | null;
  signIn: (email: string, password: string, forceLogin?: boolean) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<string>;
  signOut: (options?: { redirectTo?: Href }) => Promise<void>;
  consumePendingAuthRoute: () => Href | null;
  refreshSession: () => Promise<boolean>;
  setUser: (user: UserPublic | null) => void;
  continueAsGuest: () => Promise<void>;
  completeGuestSignIn: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(data: { user: UserPublic; accessToken: string; refreshToken: string }) {
  await setTokens(data.accessToken, data.refreshToken);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAuthRoute, setPendingAuthRoute] = useState<Href | null>(null);

  const refreshSession = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    try {
      const data = await refreshRequest(refreshToken);
      await persistSession(data);
      setUser(data.user);
      return true;
    } catch {
      await clearTokens();
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        const accessToken = await getAccessToken();
        if (accessToken) {
          try {
            const { user: currentUser } = await meRequest(accessToken);
            setUser(currentUser);
            return;
          } catch {
            const refreshed = await refreshSession();
            if (refreshed) return;
          }
        }
        setUser(null);
        setIsGuest(await isGuestMode());
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, [refreshSession]);

  const completeGuestSignIn = useCallback(async () => {
    await migrateGuestDataToAccount();
    setIsGuest(false);
  }, []);

  const continueAsGuest = useCallback(async () => {
    await setGuestMode(true);
    setIsGuest(true);
  }, []);

  const signIn = useCallback(async (email: string, password: string, forceLogin = false) => {
    const data = await loginRequest(email, password, forceLogin);
    await persistSession(data);
    setUser(data.user);
    await completeGuestSignIn();
  }, [completeGuestSignIn]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const data = await registerRequest(email, password, name);
    return data.message;
  }, []);

  const signOut = useCallback(async (options?: { redirectTo?: Href }) => {
    const refreshToken = await getRefreshToken();
    try {
      if (refreshToken) await logoutRequest(refreshToken);
    } catch {
      // ignore logout errors
    }
    await clearTokens();
    if (options?.redirectTo) setPendingAuthRoute(options.redirectTo);
    setUser(null);
  }, []);

  const consumePendingAuthRoute = useCallback(() => {
    const route = pendingAuthRoute;
    if (route) setPendingAuthRoute(null);
    return route;
  }, [pendingAuthRoute]);

  const value = useMemo(
    () => ({
      user,
      isGuest,
      isLoading,
      pendingAuthRoute,
      signIn,
      signUp,
      signOut,
      consumePendingAuthRoute,
      refreshSession,
      setUser,
      continueAsGuest,
      completeGuestSignIn,
    }),
    [
      user,
      isGuest,
      isLoading,
      pendingAuthRoute,
      signIn,
      signUp,
      signOut,
      consumePendingAuthRoute,
      refreshSession,
      continueAsGuest,
      completeGuestSignIn,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
