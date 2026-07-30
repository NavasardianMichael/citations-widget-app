import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/contexts/auth-context";
import { hasSeenOnboarding, setOnboardingSeen } from "@/services/local-storage";

type OnboardingContextValue = {
  visible: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

/** AnimatedSplashOverlay fades over ~600ms; this buffer keeps the modal from popping in over it. */
const SPLASH_FADE_MS = 700;

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, isGuest, isLoading } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Wait until the person has actually entered the app (guest or signed in) —
    // never surface the tutorial over the auth screens.
    if (isLoading || (!user && !isGuest)) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      hasSeenOnboarding().then((seen) => {
        if (!cancelled && !seen) setVisible(true);
      });
    }, SPLASH_FADE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isLoading, user, isGuest]);

  const openTutorial = useCallback(() => setVisible(true), []);

  const closeTutorial = useCallback(() => {
    setVisible(false);
    void setOnboardingSeen();
  }, []);

  const value = useMemo(
    () => ({ visible, openTutorial, closeTutorial }),
    [visible, openTutorial, closeTutorial],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
