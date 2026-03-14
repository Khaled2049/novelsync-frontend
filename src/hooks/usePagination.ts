import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';

// A4 dimensions at 96 DPI
export const PAGE_CONFIG = {
  width: 816,              // 8.5 inches * 96 DPI
  height: 1056,            // 11 inches * 96 DPI
  paddingVertical: 72,     // 0.75 inch margins top/bottom
  paddingHorizontal: 72,   // 0.75 inch margins left/right
  contentHeight: 912,      // height - (padding * 2)
  pageGap: 24,
};

export interface PageInfo {
  pageNumber: number;
  topPosition: number;
}

export interface PaginationState {
  totalPages: number;
  pages: PageInfo[];
  contentHeight: number;
}

export function usePagination(editor: Editor | null): PaginationState {
  const [paginationState, setPaginationState] = useState<PaginationState>({
    totalPages: 1,
    pages: [{ pageNumber: 1, topPosition: 0 }],
    contentHeight: 0,
  });

  const observerRef = useRef<ResizeObserver | null>(null);
  const rafRef = useRef<number | null>(null);

  const calculatePages = useCallback(() => {
    if (!editor?.view?.dom) return;

    const proseMirrorEl = editor.view.dom as HTMLElement;

    // Get actual content height
    const contentHeight = proseMirrorEl.scrollHeight;

    // Calculate number of pages needed (minimum 1)
    const totalPages = Math.max(1, Math.ceil(contentHeight / PAGE_CONFIG.contentHeight));

    // Generate page info with positions
    const pages: PageInfo[] = [];
    for (let i = 0; i < totalPages; i++) {
      pages.push({
        pageNumber: i + 1,
        topPosition: i * (PAGE_CONFIG.height + PAGE_CONFIG.pageGap),
      });
    }

    setPaginationState(prev => {
      // Only update if values changed to prevent unnecessary re-renders
      if (prev.totalPages === totalPages && prev.contentHeight === contentHeight) {
        return prev;
      }
      return { totalPages, pages, contentHeight };
    });
  }, [editor]);

  // Debounced recalculation using requestAnimationFrame
  const scheduleRecalculation = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      calculatePages();
    });
  }, [calculatePages]);

  // Set up ResizeObserver and editor update listeners
  useEffect(() => {
    if (!editor) return;

    const proseMirrorEl = editor.view?.dom as HTMLElement;
    if (!proseMirrorEl) return;

    // Initial calculation after a brief delay to let content render
    const initialTimeout = setTimeout(calculatePages, 50);

    // Watch for content size changes via ResizeObserver
    observerRef.current = new ResizeObserver(scheduleRecalculation);
    observerRef.current.observe(proseMirrorEl);

    // Listen to editor updates for content changes
    const handleUpdate = () => scheduleRecalculation();
    editor.on('update', handleUpdate);
    editor.on('transaction', handleUpdate);

    return () => {
      clearTimeout(initialTimeout);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      editor.off('update', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [editor, calculatePages, scheduleRecalculation]);

  return paginationState;
}
