import React from "react";
import { Loader } from "lucide-react";

export const StoryLoadingState: React.FC = () => {
  return (
    <div className="min-h-screen pt-20 bg-neutral-50 dark:bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-dark-green dark:text-light-green" />
        <p className="text-black/70 dark:text-white/70">Loading story...</p>
      </div>
    </div>
  );
};

