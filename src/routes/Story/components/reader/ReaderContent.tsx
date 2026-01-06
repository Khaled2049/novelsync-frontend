// src/components/reader/ReaderContent.tsx

import React from "react";
import { Chapter } from "@/types/IReader";
import { READER_FONTS } from "../../constants/readerThemes";
import { ChapterContentRenderer } from "./ChapterContentRenderer";

interface ReaderContentProps {
  chapter: Chapter;
  fontSize: number;
  fontFamily: keyof typeof READER_FONTS;
  lineHeight: number;
  textAlign: "left" | "justify";
  onWordClick: (word: string, x: number, y: number) => void;
}

export const ReaderContent: React.FC<ReaderContentProps> = ({
  chapter,
  fontSize,
  fontFamily,
  lineHeight,
  textAlign,
  onWordClick,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
      <div className="py-8">
        {/* Chapter Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 text-center">
          {chapter.title}
        </h1>

        {/* Chapter Content */}
        <div
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: READER_FONTS[fontFamily],
            lineHeight: lineHeight,
            textAlign: textAlign,
          }}
        >
          <ChapterContentRenderer
            content={chapter.content}
            onWordClick={onWordClick}
          />
        </div>
      </div>
    </div>
  );
};
