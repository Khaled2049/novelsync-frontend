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

export interface TextSelection {
  text: string;
  range: Range;
}

export interface MenuPosition {
  x: number;
  y: number;
}
