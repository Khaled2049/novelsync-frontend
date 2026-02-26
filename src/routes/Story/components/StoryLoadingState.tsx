import React from "react";
import { Loader } from "lucide-react";

export const StoryLoadingState: React.FC = () => {
  return (
    <div className="min-h-screen bg-ns-bg flex items-center justify-center">
      <div className="text-center flex flex-col items-center gap-4 animate-ns-fade-in">
        <Loader className="w-8 h-8 text-ns-accent animate-spin" />
        <p className="font-heading italic text-lg text-ns-ink-muted">
          Opening story…
        </p>
      </div>
    </div>
  );
};
