import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

const STORAGE_KEY = "theme";

const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    return;
  }

  root.classList.remove("dark");
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // "light" is the fallback — persist rehydrates synchronously from
      // localStorage before any component renders, so this value is only
      // used on the very first visit when there is no saved preference.
      theme: "light",
      toggleTheme: () => {
        const nextTheme = get().theme === "light" ? "dark" : "light";
        applyTheme(nextTheme);
        set({ theme: nextTheme });
      },
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyTheme(state.theme);
      },
    },
  ),
);

applyTheme(useThemeStore.getState().theme);
