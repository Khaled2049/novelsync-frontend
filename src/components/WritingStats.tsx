import { Chapter } from "@/types/IStory";

interface WritingStatsProps {
  currentChapter: Chapter | null;
  chaptersCount: number;
}

export function WritingStats({
  currentChapter,
  chaptersCount,
}: WritingStatsProps) {
  const wordCount = currentChapter?.content
    ? currentChapter.content.split(/\s+/).filter(Boolean).length
    : 0;

  const characterCount = currentChapter?.content?.length || 0;

  const readingTime = currentChapter?.content
    ? Math.ceil(
        currentChapter.content.split(/\s+/).filter(Boolean).length / 200
      )
    : 0;

  return (
    <>
      <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
        Writing Stats
      </h3>
      <div className="space-y-4 text-sm text-black/70 dark:text-white/70">
        <div className="flex justify-between">
          <span>Words:</span>
          <span className="font-medium text-black dark:text-white">
            {wordCount}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Characters:</span>
          <span className="font-medium text-black dark:text-white">
            {characterCount}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Reading time:</span>
          <span className="font-medium text-black dark:text-white">
            {readingTime} min
          </span>
        </div>
        <div className="flex justify-between pt-4 border-t border-black/10 dark:border-white/10">
          <span>Chapters:</span>
          <span className="font-medium text-black dark:text-white">
            {chaptersCount}
          </span>
        </div>
      </div>
    </>
  );
}
