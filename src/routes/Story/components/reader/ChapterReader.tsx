// src/components/reader/ChapterReader.tsx

import React, { useState } from "react";
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

interface ChapterReaderProps {
  currentChapter: Chapter;
  currentChapterIndex: number;
  totalChapters: number;
  onBackToDetails: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

export const ChapterReader: React.FC<ChapterReaderProps> = ({
  currentChapter,
  currentChapterIndex,
  totalChapters,
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

  // Handle search toggle
  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      clearSearch();
    }
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
        onSettingsToggle={() => setShowSettings(!showSettings)}
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

      {/* Main Reading Content */}
      <ReaderContent
        chapter={currentChapter}
        fontSize={settings.fontSize}
        fontFamily={settings.fontFamily}
        lineHeight={settings.lineHeight}
        textAlign={settings.textAlign}
        onWordClick={lookupWord}
      />

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
