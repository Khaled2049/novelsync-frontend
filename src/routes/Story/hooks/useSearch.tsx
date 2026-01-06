// src/hooks/useSearch.ts

import { useState, useCallback, useMemo } from "react";
import { SearchResult } from "@/types/IReader";

export const useSearch = (content: string) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  // Find all occurrences of the search term
  const results = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const cleanContent = content.toLowerCase();
    const cleanSearch = searchTerm.toLowerCase();
    const foundResults: SearchResult[] = [];

    let index = cleanContent.indexOf(cleanSearch);

    while (index !== -1) {
      // Get context around the match (50 chars before and after)
      const contextStart = Math.max(0, index - 50);
      const contextEnd = Math.min(
        content.length,
        index + searchTerm.length + 50
      );
      const context = content.substring(contextStart, contextEnd);

      foundResults.push({
        index,
        context:
          (contextStart > 0 ? "..." : "") +
          context +
          (contextEnd < content.length ? "..." : ""),
      });

      index = cleanContent.indexOf(cleanSearch, index + 1);
    }

    return foundResults;
  }, [content, searchTerm]);

  const search = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentResultIndex(0);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setCurrentResultIndex(0);
  }, []);

  const goToNextResult = useCallback(() => {
    if (results.length > 0) {
      setCurrentResultIndex((prev) => (prev + 1) % results.length);
    }
  }, [results.length]);

  const goToPreviousResult = useCallback(() => {
    if (results.length > 0) {
      setCurrentResultIndex(
        (prev) => (prev - 1 + results.length) % results.length
      );
    }
  }, [results.length]);

  const goToResult = useCallback(
    (index: number) => {
      if (index >= 0 && index < results.length) {
        setCurrentResultIndex(index);
      }
    },
    [results.length]
  );

  return {
    searchTerm,
    results,
    currentResultIndex,
    search,
    clearSearch,
    goToNextResult,
    goToPreviousResult,
    goToResult,
    hasResults: results.length > 0,
    totalResults: results.length,
  };
};
