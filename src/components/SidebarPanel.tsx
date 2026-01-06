import React from "react";
import { Book, Trash2 } from "lucide-react";
import { Chapter } from "@/types/IStory";

interface SidebarPanelProps {
  chapters: Chapter[];
  currentChapterId: string;
  chapterTitle: string;
  onChapterSelect: (chapter: Chapter) => void;
  onChapterDelete: (chapterId: string) => void;
  activeTab?: "chapters" | "ai";
  onTabChange?: (tab: "chapters" | "ai") => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  chapters,
  currentChapterId,

  onChapterSelect,
  onChapterDelete,
  activeTab = "chapters",
  onTabChange = () => {},
}) => {
  return (
    <div className="h-full flex flex-col">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
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
                    <span
                      className={`text-sm break-words line-clamp-2 ${
                        currentChapterId === chapter.id
                          ? "text-black dark:text-white"
                          : "text-black/70 dark:text-white/70"
                      }`}
                    >
                      {chapter.title || "Untitled"}
                    </span>
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
