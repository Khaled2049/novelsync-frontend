import React from "react";
import { AlertCircle } from "lucide-react";

interface StoryErrorStateProps {
  error: string | null;
  onRetry: () => void;
}

export const StoryErrorState: React.FC<StoryErrorStateProps> = ({
  error,
  onRetry,
}) => {
  return (
    <div className="min-h-screen pt-20 bg-neutral-50 dark:bg-black flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600 dark:text-red-400 mb-4">
          {error || "Story not found"}
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-dark-green dark:bg-light-green text-white rounded-md hover:bg-light-green dark:hover:bg-dark-green transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

