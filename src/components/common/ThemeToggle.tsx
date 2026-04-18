import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="group relative"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <div className="absolute inset-0 rounded-full bg-ns-accent opacity-0 blur-lg group-hover:opacity-20 transition-opacity duration-500" />
      <div className="relative p-2 rounded-full hover:bg-ns-surface transition-all duration-300 hover:scale-110 active:scale-95">
        {theme === "light" ? (
          <Moon className="w-5 h-5 text-ns-ink-secondary group-hover:text-ns-accent transition-colors duration-200" />
        ) : (
          <Sun className="w-5 h-5 text-ns-ink-secondary group-hover:text-ns-gold transition-colors duration-200" />
        )}
      </div>
    </button>
  );
};
