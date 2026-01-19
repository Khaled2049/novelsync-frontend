import { useState, useCallback, useRef, useEffect } from "react";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export interface SaveState {
  status: SaveStatus;
  lastSaved: Date | null;
  errorMessage?: string;
}

interface UseAutosaveOptions {
  onSave: (content: string) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseAutosaveReturn {
  triggerSave: (content: string) => void;
  forceSave: (content: string) => Promise<void>;
  saveState: SaveState;
  isDirty: boolean;
  cancelPendingSave: () => void;
  resetSaveState: () => void;
}

export function useAutosave({
  onSave,
  debounceMs = 3000,
  enabled = true,
}: UseAutosaveOptions): UseAutosaveReturn {
  const [saveState, setSaveState] = useState<SaveState>({
    status: "idle",
    lastSaved: null,
  });
  const [isDirty, setIsDirty] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContentRef = useRef<string>("");
  const isSavingRef = useRef(false);

  const cancelPendingSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetSaveState = useCallback(() => {
    setSaveState({ status: "idle", lastSaved: null });
    setIsDirty(false);
  }, []);

  const forceSave = useCallback(
    async (content: string) => {
      cancelPendingSave();
      if (!enabled || isSavingRef.current) return;

      isSavingRef.current = true;
      setSaveState((prev) => ({ ...prev, status: "saving" }));

      try {
        await onSave(content);
        setSaveState({ status: "saved", lastSaved: new Date() });
        setIsDirty(false);
      } catch (error) {
        setSaveState({
          status: "error",
          lastSaved: saveState.lastSaved,
          errorMessage:
            error instanceof Error ? error.message : "Save failed",
        });
      } finally {
        isSavingRef.current = false;
      }
    },
    [onSave, enabled, cancelPendingSave, saveState.lastSaved]
  );

  const triggerSave = useCallback(
    (content: string) => {
      if (!enabled) return;

      latestContentRef.current = content;
      setIsDirty(true);
      setSaveState((prev) => ({
        ...prev,
        status: "pending",
      }));

      cancelPendingSave();

      timerRef.current = setTimeout(() => {
        forceSave(latestContentRef.current);
      }, debounceMs);
    },
    [enabled, debounceMs, forceSave, cancelPendingSave]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPendingSave();
    };
  }, [cancelPendingSave]);

  return {
    triggerSave,
    forceSave,
    saveState,
    isDirty,
    cancelPendingSave,
    resetSaveState,
  };
}
