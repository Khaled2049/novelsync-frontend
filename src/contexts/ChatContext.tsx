import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "@/stores";

export const useChat = () =>
  useChatStore(
    useShallow((state) => ({
      messages: state.messages,
      isLoading: state.isLoading,
      error: state.error,
      chatId: state.chatId,
      sendMessage: state.sendMessage,
      initializeChat: state.initializeChat,
      clearChat: state.clearChat,
      clearError: state.clearError,
    })),
  );
