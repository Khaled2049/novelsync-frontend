import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { ChatMessage } from "@/types/IChat";
import { chatService } from "@/services/ChatService";
import { sendChatMessage, clearChatSession } from "@/api/chat";
import { useAuthContext } from "./AuthContext";

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  chatId: string | null;
  sendMessage: (storyId: string, message: string) => Promise<void>;
  initializeChat: (storyId: string) => Promise<void>;
  clearChat: (storyId: string) => Promise<void>;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuthContext();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [_currentStoryId, setCurrentStoryId] = useState<string | null>(null);

  // Track unsubscribe function for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Initialize chat for a story.
   * Loads chat history and subscribes to real-time updates.
   */
  const initializeChat = useCallback(
    async (storyId: string) => {
      if (!user) {
        console.warn("Cannot initialize chat: user not authenticated");
        return;
      }

      // Clean up previous subscription if exists
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      try {
        setCurrentStoryId(storyId);
        setError(null);

        // Get or create chat session
        const sessionId = await chatService.getOrCreateChatSession(
          storyId,
          user.uid,
        );
        setChatId(sessionId);

        // Load chat history
        const history = await chatService.getChatHistory(storyId, sessionId);
        setMessages(history);

        // Subscribe to real-time updates
        const unsubscribe = chatService.subscribeToMessages(
          storyId,
          sessionId,
          (updatedMessages) => {
            setMessages(updatedMessages);
          },
        );

        unsubscribeRef.current = unsubscribe;
      } catch (err) {
        console.error("Error initializing chat:", err);
        setError("Failed to initialize chat. Please try again.");
      }
    },
    [user],
  );

  /**
   * Send a message to the AI assistant.
   * Performs optimistic update and calls the backend API.
   */
  const sendMessage = useCallback(
    async (storyId: string, message: string) => {
      if (!user || !chatId) {
        setError("Cannot send message: chat not initialized");
        return;
      }

      const trimmedMessage = message.trim();
      if (!trimmedMessage) {
        setError("Message cannot be empty");
        return;
      }

      setIsLoading(true);
      setError(null);

      // Optimistically add user message to UI
      const optimisticUserMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: trimmedMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, optimisticUserMessage]);

      try {
        // Send to backend
        await sendChatMessage({
          storyId,
          chatId,
          message: trimmedMessage,
          includeFullContext: true,
        });

        // Messages will be updated via Firestore listener
        // No need to manually add assistant response
      } catch (err: any) {
        console.error("Error sending message:", err);
        setError(err.message || "Failed to send message. Please try again.");

        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((msg) => !msg.id.startsWith("temp-")),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [user, chatId],
  );

  const clearChat = useCallback(
    async (storyId: string) => {
      if (!chatId) return;

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      setMessages([]);
      setError(null);

      try {
        await clearChatSession({ storyId, chatId });
      } catch (err) {
        console.error("Error clearing chat session:", err);
      }

      setChatId(null);
      await initializeChat(storyId);
    },
    [chatId, initializeChat],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        error,
        chatId,
        sendMessage,
        initializeChat,
        clearChat,
        clearError,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
