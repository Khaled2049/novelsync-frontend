// src/components/reader/ChapterReader.tsx

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Chapter } from "@/types/IReader";
import { READER_THEMES } from "../../constants/readerThemes";
import { useReaderSettings } from "../../hooks/useReaderSettings";

import { useWordLookup } from "../../hooks/useWordLookup";

import { useSearch } from "../../hooks/useSearch";
import { ReaderTopBar } from "./ReaderTopBar";
import { ReaderBottomBar } from "./ReaderBottomBar";
import { ReaderContent } from "./ReaderContent";
import { ReaderSettingsPanel } from "./ReaderSettingsPanel";
import { ReaderSearchPanel } from "./ReaderSearchPanel";
import { WordDefinitionPopup } from "./WordDefinitionPopup";
import { Character } from "@/types/ICharacter";

interface ChapterReaderProps {
  currentChapter: Chapter;
  currentChapterIndex: number;
  totalChapters: number;
  chapterLoading?: boolean;
  onBackToDetails: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  characters?: Character[];
}

export const ChapterReader: React.FC<ChapterReaderProps> = ({
  currentChapter,
  currentChapterIndex,
  totalChapters,
  chapterLoading = false,
  onBackToDetails,
  onPrevChapter,
  onNextChapter,
}) => {
  // Settings
  const { settings, updateSettings } = useReaderSettings();
  const [showSettings, setShowSettings] = useState(false);

  // Search
  const {
    searchTerm,

    currentResultIndex,
    search,
    clearSearch,
    goToNextResult,
    goToPreviousResult,
    totalResults,
  } = useSearch(currentChapter.content);
  const [showSearch, setShowSearch] = useState(false);

  // Word Lookup
  const {
    definition,
    loading: definitionLoading,
    error: definitionError,
    position: definitionPosition,
    selectedWord,
    lookupWord,
    clearDefinition,
  } = useWordLookup();

  // Get current theme
  const currentTheme = READER_THEMES[settings.theme];
  const isFirstChapter = currentChapterIndex === 0;
  const isLastChapter = currentChapterIndex === totalChapters - 1;

  // Keyboard chapter navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "ArrowLeft" && !isFirstChapter) onPrevChapter();
      if (e.key === "ArrowRight" && !isLastChapter) onNextChapter();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFirstChapter, isLastChapter, onPrevChapter, onNextChapter]);

  // Handle search toggle
  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      clearSearch();
    }
  };

  const handleSettingsToggle = () => {
    setShowSettings(!showSettings);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${currentTheme.bg} ${currentTheme.text}`}
    >
      {/* Top Navigation Bar */}
      <ReaderTopBar
        theme={currentTheme}
        onBack={onBackToDetails}
        onSearchToggle={handleSearchToggle}
        onSettingsToggle={handleSettingsToggle}
      />

      {/* Settings Panel */}
      {showSettings && (
        <ReaderSettingsPanel
          settings={settings}
          onUpdateSettings={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Search Panel */}
      {showSearch && (
        <ReaderSearchPanel
          searchTerm={searchTerm}
          totalResults={totalResults}
          currentResultIndex={currentResultIndex}
          onSearchChange={search}
          onClose={() => {
            setShowSearch(false);
            clearSearch();
          }}
          onNextResult={goToNextResult}
          onPrevResult={goToPreviousResult}
        />
      )}

      {/* Word Definition Popup */}
      {selectedWord && (
        <WordDefinitionPopup
          word={selectedWord}
          definition={definition}
          loading={definitionLoading}
          error={definitionError}
          position={definitionPosition}
          onClose={clearDefinition}
        />
      )}

      {/* Side Navigation Zones */}
      {!isFirstChapter && (
        <button
          onClick={onPrevChapter}
          className="fixed left-0 top-0 bottom-0 w-16 z-30 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity duration-200 group"
          aria-label="Previous chapter"
        >
          <div
            className={`p-2 rounded-full ${currentTheme.bg} ${currentTheme.text} shadow-lg border ${currentTheme.border}`}
          >
            <ChevronLeft size={24} />
          </div>
        </button>
      )}
      {!isLastChapter && (
        <button
          onClick={onNextChapter}
          className="fixed right-0 top-0 bottom-0 w-16 z-30 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity duration-200 group"
          aria-label="Next chapter"
        >
          <div
            className={`p-2 rounded-full ${currentTheme.bg} ${currentTheme.text} shadow-lg border ${currentTheme.border}`}
          >
            <ChevronRight size={24} />
          </div>
        </button>
      )}

      {/* Chapter loading overlay */}
      {chapterLoading && (
        <div
          className={`fixed inset-0 z-40 flex items-center justify-center ${currentTheme.bg}`}
          style={{ opacity: 0.85 }}
        >
          <svg
            className="w-8 h-8 animate-spin"
            style={{ opacity: 0.5 }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              className="opacity-75"
            />
          </svg>
        </div>
      )}

      {/* Main Reading Content */}
      <ReaderContent
        chapter={currentChapter}
        fontSize={settings.fontSize}
        fontFamily={settings.fontFamily}
        lineHeight={settings.lineHeight}
        textAlign={settings.textAlign}
        onWordClick={lookupWord}
      />

      {/* The End */}
      {isLastChapter && (
        <div className="flex flex-col items-center gap-3 py-16 pb-32" style={{ opacity: 0.6 }}>
          <div className="flex items-center gap-4 w-48">
            <div className="flex-1 h-px bg-current" style={{ opacity: 0.3 }} />
            <span className="text-xs select-none">✦</span>
            <div className="flex-1 h-px bg-current" style={{ opacity: 0.3 }} />
          </div>
          <p className={`font-heading italic text-3xl ${currentTheme.text}`}>The End</p>
        </div>
      )}

      {/* Bottom Navigation */}
      <ReaderBottomBar
        theme={currentTheme}
        currentChapterIndex={currentChapterIndex}
        totalChapters={totalChapters}
        onPrevChapter={onPrevChapter}
        onNextChapter={onNextChapter}
      />
    </div>
  );
};
