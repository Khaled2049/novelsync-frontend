// src/hooks/useWordLookup.ts

import { useState, useCallback } from "react";
import { WordDefinition, MenuPosition } from "@/types/IReader";
import { dictionaryService } from "@/services/DictionaryService";

export const useWordLookup = () => {
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const lookupWord = useCallback(async (word: string, x: number, y: number) => {
    // Clean the word (remove punctuation)
    const cleanWord = word.replace(/[.,!?;:'"""'']/g, "").toLowerCase();

    if (!cleanWord) return;

    setSelectedWord(cleanWord);
    setPosition({ x, y });
    setLoading(true);
    setError(null);

    try {
      const result = await dictionaryService.lookup(cleanWord);
      setDefinition(result);
    } catch (err) {
      setError("Word not found");
      console.error("Dictionary lookup error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearDefinition = useCallback(() => {
    setDefinition(null);
    setSelectedWord(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    definition,
    loading,
    error,
    position,
    selectedWord,
    lookupWord,
    clearDefinition,
  };
};
