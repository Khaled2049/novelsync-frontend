import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "../config/firebase";
import { useAuthContext } from "./AuthContext"; // Import your existing AuthContext

interface AiUsageContextType {
  aiUsage: number;
  lastAiUsageDate: string;
  incrementAiUsage: () => Promise<void>;
  canUseAI: () => boolean;
  getRemainingAiUsage: () => number;
}

const AiUsageContext = createContext<AiUsageContextType | undefined>(undefined);

export const AiUsageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuthContext();
  const [aiUsage, setAiUsage] = useState(0);
  const [lastAiUsageDate, setLastAiUsageDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const maxAiUsage = import.meta.env.VITE_MAX_AI_USAGE || 10;
  // Sync local state when the Auth User loads or changes
  useEffect(() => {
    if (user) {
      setAiUsage(user.aiUsage || 0);
      setLastAiUsageDate(
        user.lastAiUsageDate || new Date().toISOString().split("T")[0]
      );
    } else {
      setAiUsage(0);
    }
  }, [user]); // Only runs when user logs in/out, NOT when aiUsage changes locally

  const getCurrentUtcDate = (): string => {
    return new Date().toISOString().split("T")[0];
  };

  const incrementAiUsage = useCallback(async () => {
    if (!user) return;

    const currentDate = getCurrentUtcDate();
    let newUsage = aiUsage;
    let newDate = lastAiUsageDate;

    // Reset if new day
    if (currentDate !== lastAiUsageDate) {
      newUsage = 0;
      newDate = currentDate;
    }

    // Optimistic Update: Update UI immediately
    const finalUsage = newUsage + 1;
    setAiUsage(finalUsage);
    setLastAiUsageDate(newDate);

    // Background: Update Firestore
    // Note: We do NOT call setUser in AuthContext here. That prevents the global re-render.
    const userDocRef = doc(firestore, "users", user.uid);
    updateDoc(userDocRef, {
      aiUsage: finalUsage,
      lastAiUsageDate: newDate,
    }).catch((error) => {
      console.error("Error syncing AI usage to Firestore:", error);
      // Optional: Rollback state here if needed
    });
  }, [user, aiUsage, lastAiUsageDate]);

  const canUseAI = useCallback((): boolean => {
    const currentDate = getCurrentUtcDate();
    // If dates differ, they have 0 usage effectively, so they can use AI
    if (currentDate !== lastAiUsageDate) return true;
    return aiUsage < maxAiUsage;
  }, [aiUsage, lastAiUsageDate]);

  const getRemainingAiUsage = useCallback((): number => {
    const currentDate = getCurrentUtcDate();
    if (currentDate !== lastAiUsageDate) return 10;
    return Math.max(0, maxAiUsage - aiUsage);
  }, [aiUsage, lastAiUsageDate]);

  return (
    <AiUsageContext.Provider
      value={{
        aiUsage,
        lastAiUsageDate,
        incrementAiUsage,
        canUseAI,
        getRemainingAiUsage,
      }}
    >
      {children}
    </AiUsageContext.Provider>
  );
};

export const useAiUsage = () => {
  const context = useContext(AiUsageContext);
  if (!context) {
    throw new Error("useAiUsage must be used within an AiUsageProvider");
  }
  return context;
};
