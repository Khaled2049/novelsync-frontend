// src/components/reader/ReaderBottomBar.tsx

import React from "react";

interface ReaderBottomBarProps {
  theme: {
    bg: string;
    text: string;
    border: string;
    hover: string;
  };
  currentChapterIndex: number;
  totalChapters: number;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

export const ReaderBottomBar: React.FC<ReaderBottomBarProps> = ({
  theme,
  currentChapterIndex,
  totalChapters,
}) => {
  const progress = ((currentChapterIndex + 1) / totalChapters) * 100;

  return (
    <div
      className={`fixed bottom-0 left-0 w-full ${theme.bg} border-t ${theme.border} shadow-lg transition-colors duration-300`}
    >
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center">
          <span className={`text-sm font-medium ${theme.text}`}>
            Chapter {currentChapterIndex + 1} of {totalChapters}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Reading progress: ${Math.round(progress)}%`}
          />
        </div>
      </div>
    </div>
  );
};
