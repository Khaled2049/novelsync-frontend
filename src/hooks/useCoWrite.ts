import { useState, useCallback, useEffect } from "react";
import { Editor } from "@tiptap/react";

interface UseCoWriteParams {
  openInteractivePanelOnMount?: boolean;
  editor: Editor | null;
}

export function useCoWrite({
  openInteractivePanelOnMount,
  editor,
}: UseCoWriteParams) {
  const [isInteractivePanelOpen, setIsInteractivePanelOpen] = useState(false);
  const [interactivePanelMode, setInteractivePanelMode] = useState<
    "opening" | "continuation"
  >("opening");
  const [coWriteTurnCount, setCoWriteTurnCount] = useState(0);

  const openCoWrite = useCallback(() => {
    setInteractivePanelMode("continuation");
    setIsInteractivePanelOpen(true);
  }, []);

  useEffect(() => {
    if (openInteractivePanelOnMount && editor) {
      const t = setTimeout(() => {
        setInteractivePanelMode("opening");
        setIsInteractivePanelOpen(true);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [openInteractivePanelOnMount, editor]);

  return {
    isInteractivePanelOpen,
    setIsInteractivePanelOpen,
    interactivePanelMode,
    setInteractivePanelMode,
    coWriteTurnCount,
    setCoWriteTurnCount,
    openCoWrite,
  };
}
