import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ReaderSettings } from "@/types/IReader";
import { DEFAULT_READER_SETTINGS } from "@/routes/Story/constants/readerThemes";

interface ReaderSettingsState {
  settings: ReaderSettings;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  updateSettings: (newSettings: Partial<ReaderSettings>) => void;
  resetSettings: () => void;
}

const STORAGE_KEY = "readerSettings";

export const useReaderSettingsStore = create<ReaderSettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_READER_SETTINGS,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetSettings: () => set({ settings: DEFAULT_READER_SETTINGS }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ settings: state.settings }),
      // Persisted settings from before a field was added lack the new keys;
      // the default shallow merge would drop their defaults entirely.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<ReaderSettingsState>),
        settings: {
          ...current.settings,
          ...(persisted as { settings?: Partial<ReaderSettings> })?.settings,
        },
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
