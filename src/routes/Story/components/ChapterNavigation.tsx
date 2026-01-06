import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ChapterNavigationProps {
  currentChapterIndex: number;
  totalChapters: number;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

export const ChapterNavigation: React.FC<ChapterNavigationProps> = ({
  currentChapterIndex,
  totalChapters,
  onPrevChapter,
  onNextChapter,
}) => {
  const isFirstChapter = currentChapterIndex === 0;
  const isLastChapter = currentChapterIndex === totalChapters - 1;

  return (
    <div className="flex justify-between items-center mt-6 pt-4 border-t border-black/20 dark:border-white/20">
      <button
        onClick={onPrevChapter}
        disabled={isFirstChapter}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-white dark:focus:ring-offset-black ${
          isFirstChapter
            ? "bg-black/10 dark:bg-neutral-50/10 text-black/50 dark:text-white/50 cursor-not-allowed"
            : "bg-dark-green dark:bg-light-green hover:bg-light-green dark:hover:bg-dark-green text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        }`}
      >
        <ChevronLeft size={18} />
        Previous
      </button>

      <span className="text-sm text-black/70 dark:text-white/70">
        Chapter {currentChapterIndex + 1} of {totalChapters}
      </span>

      <button
        onClick={onNextChapter}
        disabled={isLastChapter}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-white dark:focus:ring-offset-black ${
          isLastChapter
            ? "bg-black/10 dark:bg-neutral-50/10 text-black/50 dark:text-white/50 cursor-not-allowed"
            : "bg-dark-green dark:bg-light-green hover:bg-light-green dark:hover:bg-dark-green text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        }`}
      >
        Next
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

