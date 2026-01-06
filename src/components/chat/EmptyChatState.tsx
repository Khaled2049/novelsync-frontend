import React from "react";
import { Lightbulb, BookOpen, Zap, MessageSquare } from "lucide-react";

export const EmptyChatState: React.FC = () => {
  const suggestions = [
    {
      icon: Lightbulb,
      text: "Brainstorm plot twists for my story",
    },
    {
      icon: BookOpen,
      text: "Analyze character development",
    },
    {
      icon: Zap,
      text: "Improve this paragraph's pacing",
    },
    {
      icon: MessageSquare,
      text: "What are the main themes?",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-16 h-16 rounded-full bg-dark-green/10 dark:bg-light-green/10 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-dark-green dark:text-light-green" />
      </div>

      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        Your AI Writing Assistant
      </h3>

      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-xs">
        Ask me anything about your story. I have access to your chapters,
        characters, plots, and places.
      </p>

      <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-2 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-left hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              <Icon className="w-4 h-4 text-dark-green dark:text-light-green flex-shrink-0" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {suggestion.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
