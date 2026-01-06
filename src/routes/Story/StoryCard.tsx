import { FaEdit, FaTrash, FaEyeSlash, FaBookOpen, FaEye, FaHeart, FaStar } from "react-icons/fa";
import { StoryMetadata } from "@/types/IStory";
import { DollarSign } from "lucide-react";

interface StoryCardProps {
  story: StoryMetadata & {
    earnings?: {
      eth: string;
      usdc: string;
    };
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUnpublish: (id: string) => void;
  isLoading?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onEdit,
  onDelete,
  onUnpublish,
  isLoading = false,
}) => {
  // Use a different icon and color based on the published status
  const isPublished = story.isPublished;

  if (isLoading) {
    return (
      <div className="border border-black/20 dark:border-white/20 rounded-xl shadow-md dark:bg-black animate-pulse">
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          </div>
          <div className="h-7 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-20 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-10 w-24 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-black/20 dark:border-white/20 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 dark:bg-black text-black dark:text-white">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          {/* Status Indicator */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isPublished
                ? "bg-light-green/20 dark:bg-dark-green/20 text-dark-green dark:text-light-green"
                : "bg-black/10 dark:bg-white/10 text-black/70 dark:text-white/70"
            }`}
          >
            {isPublished ? (
              <FaBookOpen className="mr-1.5" />
            ) : (
              <FaEdit className="mr-1.5" />
            )}
            {isPublished ? "Published" : "Draft"}
          </span>
        </div>

        {/* Story Title */}
        <h3 className="text-2xl font-serif font-bold text-black dark:text-white mb-3 truncate">
          {story.title}
        </h3>

        {/* Analytics Section */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-black/70 dark:text-white/70">
          <div className="flex items-center gap-1.5">
            <FaEye className="w-4 h-4" />
            <span>{story.views || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FaHeart className="w-4 h-4" />
            <span>{story.likes || 0}</span>
          </div>
          {story.averageRating && (
            <div className="flex items-center gap-1.5">
              <FaStar className="w-4 h-4 text-yellow-500" />
              <span>{story.averageRating.toFixed(1)}</span>
              {story.ratingsCount && (
                <span className="text-xs">({story.ratingsCount})</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <FaBookOpen className="w-4 h-4" />
            <span>{story.chapterCount || 0} chapters</span>
          </div>
        </div>

        {/* Earnings Section */}
        {story.earnings && (parseFloat(story.earnings.eth) > 0 || parseFloat(story.earnings.usdc) > 0) && (
          <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-4 text-sm">
              {parseFloat(story.earnings.eth) > 0 && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {parseFloat(story.earnings.eth).toFixed(4)} ETH
                  </span>
                </div>
              )}
              {parseFloat(story.earnings.usdc) > 0 && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {parseFloat(story.earnings.usdc).toFixed(2)} USDC
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onEdit(story.id)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-dark-green dark:bg-light-green hover:bg-light-green dark:hover:bg-dark-green rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
          >
            <FaEdit className="mr-2" />
            Edit
          </button>
          {isPublished ? (
            <button
              onClick={() => onUnpublish(story.id)}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-black dark:text-white border border-black dark:border-white hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
            >
              <FaEyeSlash className="mr-2" />
              Unpublish
            </button>
          ) : (
            <button
              onClick={() => onDelete(story.id)}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <FaTrash className="mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
