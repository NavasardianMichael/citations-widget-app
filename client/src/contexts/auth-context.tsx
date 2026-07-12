import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
} from "@/services/auth-api";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/services/auth-storage";
import type { UserPublic } from "@/types/auth";

type AuthContextValue = {
  user: UserPublic | null;
  isLoading: boolean;
  signIn: (email: string, password: string, forceLogin?: boolean) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<string>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  setUser: (user: UserPublic | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(data: { user: UserPublic; accessToken: string; refreshToken: string }) {
  await setTokens(data.accessToken, data.refreshToken);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, [refreshSession]);

  const signIn = useCallback(async (email: string, password: string, forceLogin = false) => {
    const data = await loginRequest(email, password, forceLogin);
    await persistSession(data);
    setUser(data.user);
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const data = await registerRequest(email, password, name);
    return data.message;
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    try {
      if (refreshToken) await logoutRequest(refreshToken);
    } catch {
      // ignore logout errors
    }
    await clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signOut, refreshSession, setUser }),
    [user, isLoading, signIn, signUp, signOut, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
