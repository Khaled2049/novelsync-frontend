export interface IReadingProgress {
  storyId: string;
  chapterIndex: number; // 0-based
  lastReadAt: Date;
  storyTitle: string;
  storyAuthor: string;
  coverImageUrl: string;
  totalChapters: number;
}
