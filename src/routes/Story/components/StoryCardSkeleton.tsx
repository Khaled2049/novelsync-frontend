import React from "react";

export const StoryCardSkeleton: React.FC = () => {
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
};
