// src/components/reader/ReaderBottomBar.tsx

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  onPrevChapter,
  onNextChapter,
}) => {
  const progress = ((currentChapterIndex + 1) / totalChapters) * 100;
  const isFirstChapter = currentChapterIndex === 0;
  const isLastChapter = currentChapterIndex === totalChapters - 1;

  return (
    <div
      className={`fixed bottom-0 left-0 w-full ${theme.bg} border-t ${theme.border} shadow-lg transition-colors duration-300`}
    >
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevChapter}
            disabled={isFirstChapter}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              theme.text
            } ${
              isFirstChapter ? "opacity-50 cursor-not-allowed" : theme.hover
            }`}
            aria-label="Previous chapter"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <span className={`text-sm font-medium ${theme.text}`}>
            Chapter {currentChapterIndex + 1} of {totalChapters}
          </span>

          <button
            onClick={onNextChapter}
            disabled={isLastChapter}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              theme.text
            } ${isLastChapter ? "opacity-50 cursor-not-allowed" : theme.hover}`}
            aria-label="Next chapter"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
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
