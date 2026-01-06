import React from "react";
import { BookOpen, ThumbsUp } from "lucide-react";

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
  title,
  coverImageUrl,
  likes,
  chaptersCount,
  isLiked,
  onReadNow,
  onLike,
}) => {
  return (
    <aside className="md:w-1/3 lg:w-1/4 flex-shrink-0">
      <div className="md:sticky md:top-24">
        {/* Cover Image */}
        <div className="w-48 mx-auto md:w-full aspect-[2/3] relative rounded shadow-xl overflow-hidden mb-6">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
              <BookOpen
                size={48}
                className="text-black/20 dark:text-white/20"
              />
            </div>
          )}
        </div>

        {/* Primary Action */}
        <button
          onClick={onReadNow}
          className="w-full py-3 px-6 bg-dark-green dark:bg-light-green text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transform transition-all duration-200 flex items-center justify-center gap-2 mb-4"
        >
          <BookOpen size={20} />
          Read Now
        </button>

        {/* Secondary Actions / Stats */}
        <div className="flex justify-center md:justify-between items-center px-2 text-sm text-black/60 dark:text-white/60 mb-6">
          <button
            onClick={onLike}
            className={`flex items-center gap-1.5 transition-colors ${
              isLiked
                ? "text-dark-green"
                : "hover:text-black dark:hover:text-white"
            }`}
          >
            <ThumbsUp size={16} />
            <span>{likes} Likes</span>
          </button>
          <div className="flex items-center gap-1.5">
            <BookOpen size={16} />
            <span>{chaptersCount} Chapters</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
