/** Type definitions for chat functionality. */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  contextSnapshot?: {
    chapterIds: string[];
    characterIds: string[];
    plotIds: string[];
    placeIds: string[];
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  storyId: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  title?: string;
}

export interface SendChatMessageRequest {
  storyId: string;
  chatId?: string;
  message: string;
  includeFullContext?: boolean;
}

export interface SendChatMessageResponse {
  response: string;
  chatId: string;
  contextUsed: {
    chapters: number;
    characters: number;
    plots: number;
    places: number;
  };
}
