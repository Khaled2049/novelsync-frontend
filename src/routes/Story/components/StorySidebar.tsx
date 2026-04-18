import React from "react";
import { BookOpen, Heart, Layers } from "lucide-react";

interface StorySidebarProps {
  title: string;
  coverImageUrl?: string;
  likes: number;
  chaptersCount: number;
  isLiked: boolean;
  onReadNow: () => void;
  onLike: () => void;
}

export const StorySidebar: React.FC<StorySidebarProps> = ({
  likes,
  chaptersCount,
  isLiked,
  onReadNow,
  onLike,
}) => {
  return (
    <aside className="md:w-44 flex-shrink-0">
      <div className="md:sticky md:top-24 flex flex-col gap-3">
        {/* Primary CTA */}
        <button
          onClick={onReadNow}
          className="w-full py-2.5 px-4 bg-ns-accent text-white font-ui text-sm font-medium rounded-ns shadow-ns-sm hover:bg-ns-accent-hover active:scale-[0.97] transition-all duration-150 flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Read Now
        </button>

        {/* Like */}
        <button
          onClick={onLike}
          className={`w-full py-2 px-4 rounded-ns border font-ui text-sm transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.97] ${
            isLiked
              ? "border-ns-accent text-ns-accent bg-ns-accent-subtle"
              : "border-ns-border text-ns-ink-secondary hover:border-ns-border-strong hover:text-ns-ink hover:bg-ns-surface-hover"
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-all duration-150 ${isLiked ? "fill-current" : ""}`}
          />
          <span>
            {likes} {likes === 1 ? "Like" : "Likes"}
          </span>
        </button>

        {/* Chapters count */}
        <div className="flex items-center justify-center gap-2 py-1.5 font-ui text-xs text-ns-ink-muted">
          <Layers className="w-3.5 h-3.5" />
          <span>
            {chaptersCount} {chaptersCount === 1 ? "Chapter" : "Chapters"}
          </span>
        </div>
      </div>
    </aside>
  );
};
