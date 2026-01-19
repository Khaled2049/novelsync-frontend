import React, { useRef, useEffect, ChangeEvent } from "react";
import { Book, Trash2, FileText } from "lucide-react";
import { Chapter } from "@/types/IStory";

interface SidebarPanelProps {
  chapters: Chapter[];
  currentChapterId: string;
  chapterTitle: string;
  storyTitle: string;
  onChapterSelect: (chapter: Chapter) => void;
  onChapterDelete: (chapterId: string) => void;
  onStoryTitleChange: (title: string) => void;
  onChapterTitleChange: (title: string) => void;
  onMetadataChange: () => void;
  activeTab?: "chapters" | "ai";
  onTabChange?: (tab: "chapters" | "ai") => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  chapters,
  currentChapterId,
  chapterTitle,
  storyTitle,
  onChapterSelect,
  onChapterDelete,
  onStoryTitleChange,
  onChapterTitleChange,
  onMetadataChange,
  activeTab = "chapters",
  onTabChange = () => {},
}) => {
  // Debounce timer for saving metadata
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const value = e.target.value;
    setter(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onMetadataChange();
      debounceTimerRef.current = null;
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Story & Chapter Metadata */}
      <div className="p-4 border-b border-black/10 dark:border-white/10 space-y-4">
        {/* Story Title */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-wide mb-2">
            <FileText className="w-3 h-3" />
            Story
          </label>
          <input
            type="text"
            value={storyTitle}
            onChange={(e) => handleInputChange(e, onStoryTitleChange)}
            placeholder="Story Title"
            className="w-full text-sm font-semibold px-3 py-2 bg-black/5 dark:bg-white/5 rounded-lg border-0 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green transition-all"
            maxLength={80}
          />
        </div>

        {/* Chapter Title */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-wide mb-2">
            <Book className="w-3 h-3" />
            Current Chapter
          </label>
          <input
            type="text"
            value={chapterTitle}
            onChange={(e) => handleInputChange(e, onChapterTitleChange)}
            placeholder="Chapter Title"
            className="w-full text-sm px-3 py-2 bg-black/5 dark:bg-white/5 rounded-lg border-0 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green transition-all"
            maxLength={80}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-black/10 dark:border-white/10">
        <button
          className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 text-sm transition-colors ${
            activeTab === "chapters"
              ? "border-b-2 border-dark-green dark:border-light-green text-black dark:text-white font-medium"
              : "text-black/50 dark:text-white/50 hover:text-black/70 dark:hover:text-white/70"
          }`}
          onClick={() => onTabChange("chapters")}
        >
          <Book className="w-4 h-4" />
          <span>Chapters</span>
        </button>
      </div>

      {/* Chapters List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {chapters.length === 0 ? (
            <div className="text-center py-12">
              <Book className="w-10 h-10 text-black/30 dark:text-white/30 mx-auto mb-3" />
              <p className="text-sm text-black/50 dark:text-white/50">
                No chapters yet
              </p>
            </div>
          ) : (
            chapters.map((chapter) => (
              <div
                key={chapter.id}
                className={`w-full rounded-lg transition-all flex items-center justify-between group ${
                  currentChapterId === chapter.id
                    ? "bg-dark-green/10 dark:bg-light-green/10"
                    : "hover:bg-black/5 dark:hover:bg-neutral-50/5"
                }`}
              >
                <button
                  onClick={() => onChapterSelect(chapter)}
                  className="flex-1 text-left px-4 py-3"
                >
                  <div className="flex items-start space-x-3">
                    <Book className="w-4 h-4 flex-shrink-0 mt-0.5 text-dark-green dark:text-light-green" />
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm break-words line-clamp-2 block ${
                          currentChapterId === chapter.id
                            ? "text-black dark:text-white"
                            : "text-black/70 dark:text-white/70"
                        }`}
                      >
                        {chapter.title || "Untitled"}
                      </span>
                      <span className="text-xs text-black/50 dark:text-white/50">
                        {(chapter.wordCount || 0).toLocaleString()} words
                      </span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChapterDelete(chapter.id);
                  }}
                  className="px-3 py-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  aria-label="Delete chapter"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
