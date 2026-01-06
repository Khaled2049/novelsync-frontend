import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Chatbot } from "./Chatbot";
import { useParams } from "react-router-dom";

export const FloatingChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { storyId, id } = useParams<{ storyId?: string; id?: string }>();

  // Determine storyId from route params (could be /story/:id or /editor/:storyId)
  const currentStoryId = storyId || id;

  // Don't show if no story context
  if (!currentStoryId) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-dark-green dark:bg-light-green text-white dark:text-black rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
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
