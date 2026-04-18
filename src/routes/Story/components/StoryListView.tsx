import React from "react";
import {
  FaEdit,
  FaTrash,
  FaEyeSlash,
  FaBookOpen,
  FaEye,
  FaHeart,
  FaStar,
} from "react-icons/fa";
import { StoryMetadata } from "@/types/IStory";
import { DollarSign } from "lucide-react";

interface StoryListViewProps {
  stories: (StoryMetadata & {
    earnings?: {
      eth: string;
      usdc: string;
    };
  })[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUnpublish: (id: string) => void;
  isLoading?: boolean;
}

export const StoryListView: React.FC<StoryListViewProps> = ({
  stories,
  onEdit,
  onDelete,
  onUnpublish,
  isLoading = false,
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-200 dark:bg-gray-800 h-16 rounded-lg"
          ></div>
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-white dark:bg-black rounded-lg shadow-sm border border-black/20 dark:border-white/20">
        <p className="text-black/70 dark:text-white/70">No stories found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-black/20 dark:border-white/20">
            <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-white">
              Title
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-white">
              Status
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-white">
              Analytics
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-white">
              Earnings
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-black dark:text-white">
              Last Updated
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-black dark:text-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {stories.map((story) => (
            <tr
              key={story.id}
              className="border-b border-black/10 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <td className="py-4 px-4">
                <div className="font-medium text-black dark:text-white truncate max-w-xs">
                  {story.title}
                </div>
                {story.description && (
                  <div className="text-sm text-black/60 dark:text-white/60 truncate max-w-xs mt-1">
                    {story.description}
                  </div>
                )}
              </td>
              <td className="py-4 px-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    story.isPublished
                      ? "bg-light-green/20 dark:bg-dark-green/20 text-dark-green dark:text-light-green"
                      : "bg-black/10 dark:bg-white/10 text-black/70 dark:text-white/70"
                  }`}
                >
                  {story.isPublished ? (
                    <FaBookOpen className="mr-1.5" />
                  ) : (
                    <FaEdit className="mr-1.5" />
                  )}
                  {story.isPublished ? "Published" : "Draft"}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-black/70 dark:text-white/70">
                    <FaEye className="w-3.5 h-3.5" />
                    <span>{story.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-black/70 dark:text-white/70">
                    <FaHeart className="w-3.5 h-3.5" />
                    <span>{story.likes || 0}</span>
                  </div>
                  {story.averageRating && (
                    <div className="flex items-center gap-1 text-black/70 dark:text-white/70">
                      <FaStar className="w-3.5 h-3.5 text-yellow-500" />
                      <span>{story.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="text-black/70 dark:text-white/70">
                    {story.chapterCount} ch
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                {story.earnings &&
                (parseFloat(story.earnings.eth) > 0 ||
                  parseFloat(story.earnings.usdc) > 0) ? (
                  <div className="flex flex-col gap-1 text-sm">
                    {parseFloat(story.earnings.eth) > 0 && (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="font-medium">
                          {parseFloat(story.earnings.eth).toFixed(4)} ETH
                        </span>
                      </div>
                    )}
                    {parseFloat(story.earnings.usdc) > 0 && (
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="font-medium">
                          {parseFloat(story.earnings.usdc).toFixed(2)} USDC
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-black/40 dark:text-white/40">
                    No earnings
                  </span>
                )}
              </td>
              <td className="py-4 px-4 text-sm text-black/70 dark:text-white/70">
                {formatDate(story.updatedAt)}
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(story.id)}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white bg-dark-green dark:bg-light-green hover:bg-light-green dark:hover:bg-dark-green rounded-lg transition-colors"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  {story.isPublished ? (
                    <button
                      onClick={() => onUnpublish(story.id)}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-black dark:text-white border border-black dark:border-white hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                      title="Unpublish"
                    >
                      <FaEyeSlash />
                    </button>
                  ) : (
                    <button
                      onClick={() => onDelete(story.id)}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
