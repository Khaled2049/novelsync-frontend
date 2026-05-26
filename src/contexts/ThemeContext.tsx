import { useShallow } from "zustand/react/shallow";
import { Theme, useThemeStore } from "@/stores";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const useTheme = (): ThemeContextType =>
  useThemeStore(
    useShallow((state) => ({
      theme: state.theme,
      toggleTheme: state.toggleTheme,
    })),
  );
