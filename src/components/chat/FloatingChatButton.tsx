import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Chatbot } from "./Chatbot";
import { useParams } from "react-router-dom";

interface FloatingChatButtonProps {
  storyId?: string;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ storyId: propStoryId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { storyId, id } = useParams<{ storyId?: string; id?: string }>();

  // Use prop storyId if provided, otherwise fall back to route params
  const currentStoryId = propStoryId || storyId || id;

  // Don't show if no story context
  if (!currentStoryId) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 bg-dark-green dark:bg-light-green text-white text-sm rounded-md shadow-sm hover:bg-light-green dark:hover:bg-dark-green transition-colors duration-200 flex items-center"
        >
          <MessageCircle className="w-5 h-5" />
          <span>AI Assistant</span>
        </button>
      )}

      {/* Sliding Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full md:w-96 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl">
            <Chatbot
              storyId={currentStoryId}
              onClose={() => setIsOpen(false)}
              mode="floating"
            />
          </div>
        </>
      )}
    </>
  );
};
