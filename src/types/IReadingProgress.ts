export interface IReadingProgress {
  storyId: string;
  chapterIndex: number; // 0-based
  lastReadAt: Date;
  storyTitle: string;
  storyAuthor: string;
  coverImageUrl: string;
  totalChapters: number;
  /** Scroll position within the saved chapter, 0–1. */
  scrollPercent?: number;
}
