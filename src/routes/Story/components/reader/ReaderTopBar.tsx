// src/components/reader/ReaderTopBar.tsx

import React from "react";
import { ArrowLeft, Settings, Search } from "lucide-react";

interface ReaderTopBarProps {
  theme: {
    bg: string;
    text: string;
    border: string;
    hover: string;
  };
  onBack: () => void;
  onSearchToggle: () => void;
  onSettingsToggle: () => void;
}

export const ReaderTopBar: React.FC<ReaderTopBarProps> = ({
  theme,
  onBack,
  onSearchToggle,
  onSettingsToggle,
}) => {
  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 ${theme.bg} border-b ${theme.border} shadow-sm transition-colors duration-300`}
    >
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme.hover} transition-colors ${theme.text}`}
          aria-label="Back to story details"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onSearchToggle}
            className={`p-2 rounded-lg ${theme.hover} transition-colors ${theme.text}`}
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          <button
            onClick={onSettingsToggle}
            className={`p-2 rounded-lg ${theme.hover} transition-colors ${theme.text}`}
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
