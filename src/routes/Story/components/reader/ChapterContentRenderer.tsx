// src/components/reader/ChapterContentRenderer.tsx

import React, { JSX, useCallback } from "react";

const ALLOWED_IMAGE_HOSTS = [
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
];

function isSafeImageSrc(src: string): boolean {
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      ALLOWED_IMAGE_HOSTS.some(
        (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
      )
    );
  } catch {
    return false;
  }
}

interface ChapterContentRendererProps {
  content: string;
  onWordClick: (word: string, x: number, y: number) => void;
}

export const ChapterContentRenderer: React.FC<ChapterContentRendererProps> = ({
  content,
  onWordClick,
}) => {
  const handleParagraphDoubleClick = useCallback(
    (_e: React.MouseEvent<HTMLElement>) => {
      const selection = window.getSelection();
      const word = selection
        ?.toString()
        .trim()
        .replace(/[^a-zA-Z'-]/g, "");
      if (word) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        if (rect) {
          onWordClick(word, rect.left + rect.width / 2, rect.top - 10);
        }
      }
    },
    [onWordClick],
  );

  const renderContent = useCallback(
    (htmlContent: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
      const elements = Array.from(doc.body.childNodes);

      return elements.map((el, index) => {
        const key = `content-${index}`;

        switch (el.nodeName) {
          case "P": {
            return (
              <p
                key={key}
                className="mb-6"
                onDoubleClick={handleParagraphDoubleClick}
              >
                {el.textContent}
              </p>
            );
          }

          case "IMG": {
            const src = (el as HTMLImageElement).src;
            const alt = (el as HTMLImageElement).alt || "Story image";
            if (!src || !isSafeImageSrc(src)) {
              return null;
            }
            return (
              <div key={key} className="flex justify-center my-8">
                <img
                  src={src}
                  alt={alt}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  loading="lazy"
                />
              </div>
            );
          }

          case "UL": {
            const listItems = Array.from(el.childNodes).map((li, liIndex) => (
              <li key={liIndex} className="ml-6 list-disc mb-2 text-current">
                {(li as HTMLElement).textContent}
              </li>
            ));
            return (
              <ul key={key} className="mb-6">
                {listItems}
              </ul>
            );
          }

          case "OL": {
            const listItems = Array.from(el.childNodes).map((li, liIndex) => (
              <li key={liIndex} className="ml-6 list-decimal mb-2 text-current">
                {(li as HTMLElement).textContent}
              </li>
            ));
            return (
              <ol key={key} className="mb-6">
                {listItems}
              </ol>
            );
          }

          case "H1":
          case "H2":
          case "H3":
          case "H4":
          case "H5":
          case "H6":
            return React.createElement(
              el.nodeName.toLowerCase() as keyof JSX.IntrinsicElements,
              {
                key,
                className: "font-bold mb-4 mt-8 text-current",
              },
              el.textContent,
            );

          case "BLOCKQUOTE":
            return (
              <blockquote
                key={key}
                className="border-l-4 border-current opacity-70 pl-4 italic my-6 text-current"
              >
                {el.textContent}
              </blockquote>
            );

          default:
            return el.textContent ? (
              <div key={key} className="mb-2">
                {el.textContent}
              </div>
            ) : null;
        }
      });
    },
    [handleParagraphDoubleClick],
  );

  return <div className="select-text">{renderContent(content)}</div>;
};
