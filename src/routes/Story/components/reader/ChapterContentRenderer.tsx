// src/components/reader/ChapterContentRenderer.tsx

import React, { JSX, useCallback } from "react";
import { ChapterBlock, ChapterModel, RenderMark } from "@/types/IReader";
import { HIGHLIGHT_COLORS } from "../../constants/readerThemes";
import { cleanWord } from "../../hooks/useChapterModel";

interface ChapterContentRendererProps {
  model: ChapterModel;
  marks: RenderMark[];
  /** Ref attached to the active search match for scrollIntoView. */
  activeMarkRef: React.RefObject<HTMLElement | null>;
  onWordClick: (word: string, x: number, y: number) => void;
  onHighlightClick: (id: string, x: number, y: number) => void;
}

const SEARCH_CLASS = "bg-amber-300/70 text-black rounded-[2px]";
const SEARCH_ACTIVE_CLASS =
  "bg-amber-400 text-black ring-2 ring-amber-500 rounded-[2px] scroll-mt-24";

type Segment =
  | { kind: "text"; key: string; text: string }
  | {
      kind: "search";
      key: string;
      text: string;
      active: boolean;
    }
  | {
      kind: "highlight";
      key: string;
      text: string;
      color: NonNullable<RenderMark["color"]>;
      id: string;
    };

/**
 * Split a block's local text into consecutive styled segments based on the
 * global `marks` that overlap it. Search marks win visually over highlights.
 */
function buildSegments(
  text: string,
  blockStart: number,
  marks: RenderMark[],
  blockKey: string,
): Segment[] {
  const blockEnd = blockStart + text.length;

  // Clip marks to this block, in local coordinates.
  const local = marks
    .map((m) => ({
      lo: Math.max(m.start, blockStart) - blockStart,
      hi: Math.min(m.end, blockEnd) - blockStart,
      mark: m,
    }))
    .filter((m) => m.hi > m.lo);

  if (local.length === 0) {
    return [{ kind: "text", key: `seg-${blockKey}-0`, text }];
  }

  // Boundary points partition [0, text.length) into atomic intervals.
  const points = new Set<number>([0, text.length]);
  for (const m of local) {
    points.add(m.lo);
    points.add(m.hi);
  }
  const sorted = [...points].sort((a, b) => a - b);

  const segments: Segment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (b <= a) continue;
    const slice = text.slice(a, b);
    const key = `seg-${blockKey}-${a}`;
    const covering = local.filter((m) => m.lo <= a && m.hi >= b);

    const searchMark = covering.find((m) => m.mark.kind === "search");
    if (searchMark) {
      segments.push({
        kind: "search",
        key,
        text: slice,
        active: covering.some((m) => m.mark.kind === "search" && m.mark.active),
      });
      continue;
    }

    // Topmost highlight = last in array order (search is appended after).
    const highlightMark = [...covering]
      .reverse()
      .find((m) => m.mark.kind === "highlight");
    if (highlightMark && highlightMark.mark.color && highlightMark.mark.id) {
      segments.push({
        kind: "highlight",
        key,
        text: slice,
        color: highlightMark.mark.color,
        id: highlightMark.mark.id,
      });
      continue;
    }

    segments.push({ kind: "text", key, text: slice });
  }

  return segments;
}

const ChapterContentRendererBase: React.FC<ChapterContentRendererProps> = ({
  model,
  marks,
  activeMarkRef,
  onWordClick,
  onHighlightClick,
}) => {
  const handleDoubleClick = useCallback(() => {
    const selection = window.getSelection();
    const word = cleanWord(selection?.toString() ?? "");
    if (!word) return;
    const range = selection?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();
    if (rect) {
      onWordClick(word, rect.left + rect.width / 2, rect.top - 10);
    }
  }, [onWordClick]);

  const renderSegments = useCallback(
    (text: string, blockStart: number, blockKey: string) => {
      const segments = buildSegments(text, blockStart, marks, blockKey);
      return segments.map((seg) => {
        if (seg.kind === "search") {
          return (
            <mark
              key={seg.key}
              ref={
                seg.active
                  ? (activeMarkRef as React.RefObject<HTMLElement>)
                  : undefined
              }
              data-active={seg.active ? "true" : undefined}
              className={seg.active ? SEARCH_ACTIVE_CLASS : SEARCH_CLASS}
            >
              {seg.text}
            </mark>
          );
        }
        if (seg.kind === "highlight") {
          return (
            <mark
              key={seg.key}
              data-highlight-id={seg.id}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onHighlightClick(seg.id, e.clientX, e.clientY);
              }}
              className={`${HIGHLIGHT_COLORS[seg.color]} text-black rounded-[2px] cursor-pointer`}
            >
              {seg.text}
            </mark>
          );
        }
        return <React.Fragment key={seg.key}>{seg.text}</React.Fragment>;
      });
    },
    [marks, activeMarkRef, onHighlightClick],
  );

  const renderBlock = (block: ChapterBlock) => {
    const { key } = block;
    switch (block.kind) {
      case "img":
        return block.imgSrc ? (
          <div key={key} className="flex justify-center my-8">
            <img
              src={block.imgSrc}
              alt={block.imgAlt}
              className="max-w-full h-auto rounded-lg shadow-lg"
              loading="lazy"
            />
          </div>
        ) : null;

      case "ul":
      case "ol": {
        const ListTag = block.kind;
        return (
          <ListTag key={key} className="mb-6">
            {(block.items ?? []).map((item, i) => (
              <li
                key={`${key}-li-${i}`}
                className={`ml-6 mb-2 text-current ${block.kind === "ul" ? "list-disc" : "list-decimal"}`}
              >
                {renderSegments(item.text, item.start, `${key}-li-${i}`)}
              </li>
            ))}
          </ListTag>
        );
      }

      case "blockquote":
        return (
          <blockquote
            key={key}
            className="border-l-4 border-current opacity-70 pl-4 italic my-6 text-current"
          >
            {renderSegments(block.text ?? "", block.start, key)}
          </blockquote>
        );

      case "p":
        return (
          <p key={key} className="mb-6">
            {renderSegments(block.text ?? "", block.start, key)}
          </p>
        );

      case "div":
        return (
          <div key={key} className="mb-2">
            {renderSegments(block.text ?? "", block.start, key)}
          </div>
        );

      default:
        return React.createElement(
          block.kind as keyof JSX.IntrinsicElements,
          { key, className: "font-bold mb-4 mt-8 text-current" },
          renderSegments(block.text ?? "", block.start, key),
        );
    }
  };

  return (
    <div className="select-text" onDoubleClick={handleDoubleClick}>
      {model.blocks.map(renderBlock)}
    </div>
  );
};

export const ChapterContentRenderer = React.memo(ChapterContentRendererBase);
