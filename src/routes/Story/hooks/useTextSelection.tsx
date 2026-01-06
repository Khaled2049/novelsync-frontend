// src/hooks/useTextSelection.ts

import { useState, useEffect, useCallback } from "react";
import { TextSelection, MenuPosition } from "@/types/IReader";

export const useTextSelection = () => {
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    x: 0,
    y: 0,
  });
  const [showMenu, setShowMenu] = useState(false);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();

    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedText({
        text: selection.toString().trim(),
        range,
      });

      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });

      setShowMenu(true);
    } else {
      setShowMenu(false);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedText(null);
    setShowMenu(false);
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(handleSelection, 10);
    };

    const handleTouchEnd = () => {
      setTimeout(handleSelection, 10);
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't clear if clicking on the highlight menu
      if (!target.closest("[data-highlight-menu]")) {
        if (showMenu && !window.getSelection()?.toString()) {
          clearSelection();
        }
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleSelection, showMenu, clearSelection]);

  return {
    selectedText,
    menuPosition,
    showMenu,
    clearSelection,
  };
};
