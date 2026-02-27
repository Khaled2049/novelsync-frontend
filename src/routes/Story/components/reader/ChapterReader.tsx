// src/components/reader/ChapterReader.tsx

import React, { useState } from "react";
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
  onBackToDetails: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  characters?: Character[];
}

export const ChapterReader: React.FC<ChapterReaderProps> = ({
  currentChapter,
  currentChapterIndex,
  totalChapters,
  onBackToDetails,
  onPrevChapter,
  onNextChapter,
  characters = [],
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

  // Top bar visibility
  const [showTopBar, setShowTopBar] = useState(true);

  // Characters panel
  const [showCharacters, setShowCharacters] = useState(false);

  // Handle search toggle
  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      clearSearch();
    }
    setShowTopBar(false);
  };

  const handleSettingsToggle = () => {
    setShowSettings(!showSettings);
    setShowTopBar(false);
  };

  const handleCharactersToggle = () => {
    setShowCharacters((v) => !v);
    setShowTopBar(false);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${currentTheme.bg} ${currentTheme.text}`}
    >
      {/* Top Navigation Bar */}
      {showTopBar ? (
        <ReaderTopBar
          theme={currentTheme}
          onBack={onBackToDetails}
          onSearchToggle={handleSearchToggle}
          onSettingsToggle={handleSettingsToggle}
          onCharactersToggle={handleCharactersToggle}
          hasCharacters={characters.length > 0}
        />
      ) : (
        <button
          onClick={() => setShowTopBar(true)}
          className="fixed top-0 left-0 w-full h-14 z-50"
          aria-label="Show navigation bar"
        />
      )}

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
