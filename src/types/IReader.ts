export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface Highlight {
  id: string;
  chapterId: string;
  text: string;
  color: "yellow" | "green" | "blue" | "pink";
  note?: string;
  position: {
    start: number;
    end: number;
  };
  createdAt: Date;
}

export interface ReaderSettings {
  fontSize: number;
  fontFamily: "serif" | "sans" | "mono" | "palatino" | "bookerly";
  lineHeight: number;
  theme: "light" | "dark" | "sepia";
  textAlign: "left" | "justify";
}

export interface WordDefinition {
  word: string;
  definition: string;
  partOfSpeech: string;
  examples?: string[];
}

export interface SearchResult {
  index: number;
  context: string;
}

/** A half-open character range [start, end) into a chapter's plain text. */
export interface MarkableRange {
  start: number;
  end: number;
}

export type ChapterBlockKind =
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "blockquote"
  | "ul"
  | "ol"
  | "img"
  | "div";

/**
 * One top-level block of a parsed chapter. `start`/`end` are global offsets
 * into the chapter's `plainText`. Text blocks carry normalized `text`; lists
 * carry `items`; images carry `imgSrc`/`imgAlt` and an empty [start, end) range.
 */
export interface ChapterBlock {
  key: string;
  kind: ChapterBlockKind;
  start: number;
  end: number;
  text?: string;
  items?: { text: string; start: number; end: number }[];
  imgSrc?: string;
  imgAlt?: string;
}

/** Parsed-once representation of a chapter, the source of truth for offsets. */
export interface ChapterModel {
  blocks: ChapterBlock[];
  plainText: string;
  wordCount: number;
}

/** A range to visually mark in the rendered text (search match or highlight). */
export interface RenderMark {
  start: number;
  end: number;
  kind: "search" | "highlight";
  /** Highlight colour (highlight marks only). */
  color?: Highlight["color"];
  /** Highlight id, or `search-${i}` for search matches. */
  id?: string;
  /** The active (focused) search match. */
  active?: boolean;
}

export interface TextSelection {
  text: string;
  range: Range;
}

export interface MenuPosition {
  x: number;
  y: number;
}
