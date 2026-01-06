import React from "react";
import { ChatMessage as IChatMessage } from "@/types/IChat";
import { User, Sparkles } from "lucide-react";

interface ChatMessageProps {
  message: IChatMessage;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={`flex gap-3 ${isAssistant ? "flex-row" : "flex-row-reverse"}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAssistant
            ? "bg-dark-green/10 dark:bg-light-green/10"
            : "bg-neutral-200 dark:bg-neutral-700"
        }`}
      >
        {isAssistant ? (
          <Sparkles className="w-4 h-4 text-dark-green dark:text-light-green" />
        ) : (
          <User className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`flex-1 rounded-lg p-3 ${
          isAssistant
            ? "bg-neutral-100 dark:bg-neutral-800"
            : "bg-dark-green/10 dark:bg-light-green/10"
        }`}
      >
        <p className="text-neutral-900 dark:text-white whitespace-pre-wrap text-sm">
          {message.content}
        </p>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};
