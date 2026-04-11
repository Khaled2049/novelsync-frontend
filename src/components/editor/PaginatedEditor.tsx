import React, { useEffect } from "react";
import { Editor } from "@tiptap/react";
import {
  usePagination,
  PAGE_CONFIG,
  PaginationState,
} from "@/hooks/usePagination";

interface PaginatedEditorProps {
  editor: Editor | null;
  children: React.ReactNode;
  onPageCountChange?: (pageCount: number) => void;
}

export const PaginatedEditor: React.FC<PaginatedEditorProps> = ({
  editor,
  children,
  onPageCountChange,
}) => {
  const paginationState = usePagination(editor);

  // Notify parent of page count changes
  useEffect(() => {
    if (onPageCountChange) {
      onPageCountChange(paginationState.totalPages);
    }
  }, [paginationState.totalPages, onPageCountChange]);

  // Calculate minimum container height (all pages + gaps)
  const totalHeight =
    paginationState.totalPages * PAGE_CONFIG.height +
    (paginationState.totalPages - 1) * PAGE_CONFIG.pageGap;

  return (
    <div
      className="paginated-editor-container"
      style={{
        position: "relative",
        width: `${PAGE_CONFIG.width}px`,
        minHeight: `${totalHeight}px`,
        margin: "0 auto",
      }}
    >
      {/* Page backgrounds layer */}
      <div
        className="page-backgrounds"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {paginationState.pages.map((page) => (
          <PageBackground
            key={page.pageNumber}
            pageNumber={page.pageNumber}
            topPosition={page.topPosition}
            isLastPage={page.pageNumber === paginationState.totalPages}
          />
        ))}
      </div>

      {/* Editor content layer */}
      <div
        className="editor-content-layer"
        style={{
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
};

interface PageBackgroundProps {
  pageNumber: number;
  topPosition: number;
  isLastPage: boolean;
}

const PageBackground: React.FC<PageBackgroundProps> = ({
  pageNumber,
  topPosition,
  isLastPage,
}) => {
  return (
    <div
      className="page-background"
      style={{
        position: "absolute",
        top: `${topPosition}px`,
        left: 0,
        width: "100%",
        height: `${PAGE_CONFIG.height}px`,
        marginBottom: isLastPage ? "0" : `${PAGE_CONFIG.pageGap}px`,
      }}
    >
      {/* Page number positioned at bottom right */}
      <div
        className="page-number"
        style={{
          position: "absolute",
          bottom: "24px",
          right: "48px",
          fontSize: "11pt",
          fontFamily: "'Merriweather', Georgia, serif",
          userSelect: "none",
        }}
      >
        {pageNumber}
      </div>
    </div>
  );
};

// Export pagination state type for use in other components
export type { PaginationState };
