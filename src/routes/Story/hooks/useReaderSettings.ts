// src/hooks/useReaderSettings.ts

import { useState, useEffect } from "react";
import { ReaderSettings } from "@/types/IReader";
import { DEFAULT_READER_SETTINGS } from "../constants/readerThemes";

const STORAGE_KEY = "readerSettings";

export const useReaderSettings = () => {
  const [settings, setSettings] = useState<ReaderSettings>(
    DEFAULT_READER_SETTINGS
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_READER_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load reader settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error("Failed to save reader settings:", error);
      }
    }
  }, [settings, isLoading]);

  const updateSettings = (newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_READER_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoading,
  };
};
