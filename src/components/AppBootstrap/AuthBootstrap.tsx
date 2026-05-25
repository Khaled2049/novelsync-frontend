import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebase";
import { appQueryClient } from "@/lib/queryClient";
import { useAuthStore, useChatStore } from "@/stores";

export const AuthBootstrap = () => {
  const previousUidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const nextUid = firebaseUser?.uid ?? null;

      if (previousUidRef.current !== null && previousUidRef.current !== nextUid) {
        appQueryClient.clear();
        useChatStore.getState().resetChatState();
      }
      previousUidRef.current = nextUid;

      try {
        await useAuthStore.getState().hydrateUser(firebaseUser);
      } catch (error) {
        console.error("Failed to hydrate auth state:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
};
