import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 group"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {/* Outer ring glow */}
      <div className="absolute inset-0 rounded-full bg-ns-accent opacity-0 blur-lg group-hover:opacity-20 transition-opacity duration-500" />

      {/* Button body */}
      <div className="relative p-3 rounded-full bg-ns-elevated border border-ns-border shadow-ns hover:shadow-ns-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:border-ns-accent/30">
        {theme === "light" ? (
          <Moon className="w-5 h-5 text-ns-ink-secondary group-hover:text-ns-accent transition-colors duration-200" />
        ) : (
          <Sun className="w-5 h-5 text-ns-ink-secondary group-hover:text-ns-gold transition-colors duration-200" />
        )}
      </div>
    </button>
  );
};
