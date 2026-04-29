import { createContext, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";

interface DemoModeContextValue {
  isDemo: boolean;
  /**
   * Call before any auth-gated action.
   * Returns true if the action should proceed.
   * In demo mode: navigates to /sign-in and returns false.
   */
  requireAuth: () => boolean;
}

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemo: false,
  requireAuth: () => true,
});

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const requireAuth = useCallback((): boolean => {
    navigate("/sign-in");
    return false;
  }, [navigate]);

  return (
    <DemoModeContext.Provider value={{ isDemo: true, requireAuth }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode(): DemoModeContextValue {
  return useContext(DemoModeContext);
}
