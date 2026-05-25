import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDemoStore } from "@/stores";

interface DemoModeContextValue {
  isDemo: boolean;
  /**
   * Call before any auth-gated action.
   * Returns true if the action should proceed.
   * In demo mode: navigates to /sign-in and returns false.
   */
  requireAuth: () => boolean;
}

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const setDemoMode = useDemoStore((state) => state.setDemoMode);

  useEffect(() => {
    setDemoMode(true);
    return () => {
      setDemoMode(false);
    };
  }, [setDemoMode]);

  return <>{children}</>;
}

export function useDemoMode(): DemoModeContextValue {
  const navigate = useNavigate();
  const isDemo = useDemoStore((state) => state.isDemo);

  const requireAuth = useCallback((): boolean => {
    if (!isDemo) return true;
    navigate("/sign-in");
    return false;
  }, [isDemo, navigate]);

  return { isDemo, requireAuth };
}
