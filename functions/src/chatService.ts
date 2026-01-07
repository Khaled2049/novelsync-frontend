/** Chat history and session management utilities. */
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: admin.firestore.Timestamp;
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
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  messageCount: number;
  title?: string;
}

/**
 * Get chat history for a story chat session.
 * Returns messages in chronological order (oldest first).
 */
export async function getChatHistory(
  db: admin.firestore.Firestore,
  storyId: string,
  chatId: string,
  limit: number = 10
): Promise<ChatMessage[]> {
  try {
    const messagesRef = db
      .collection("stories")
      .doc(storyId)
      .collection("chats")
      .doc(chatId)
      .collection("messages");

    const snapshot = await messagesRef
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    // Return in chronological order (reverse the desc query)
    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp,
          contextSnapshot: data.contextSnapshot,
        } as ChatMessage;
      })
      .reverse();
  } catch (error) {
    logger.error("Error getting chat history", { storyId, chatId, error });
    return [];
  }
}

/**
 * Save user message and assistant response to Firestore.
 * Uses a batch write for atomic operation.
 */
export async function saveChatMessages(
  db: admin.firestore.Firestore,
  storyId: string,
  chatId: string,
  userId: string,
  userMessage: string,
  assistantResponse: string,
  contextSnapshot?: {
    chapterIds: string[];
    characterIds: string[];
    plotIds: string[];
    placeIds: string[];
  }
): Promise<void> {
  try {
    const chatRef = db
      .collection("stories")
      .doc(storyId)
      .collection("chats")
      .doc(chatId);

    const messagesRef = chatRef.collection("messages");

    const batch = db.batch();

    // Create user message document
    const userMsgRef = messagesRef.doc();
    batch.set(userMsgRef, {
      id: userMsgRef.id,
      role: "user",
      content: userMessage,
      timestamp: FieldValue.serverTimestamp(),
    });

    // Create assistant message document
    const assistantMsgRef = messagesRef.doc();
    batch.set(assistantMsgRef, {
      id: assistantMsgRef.id,
      role: "assistant",
      content: assistantResponse,
      timestamp: FieldValue.serverTimestamp(),
      ...(contextSnapshot && { contextSnapshot }),
    });

    // Update chat session metadata
    batch.set(
      chatRef,
      {
        id: chatId,
        userId,
        storyId,
        updatedAt: FieldValue.serverTimestamp(),
        messageCount: FieldValue.increment(2),
      },
      { merge: true }
    );

    await batch.commit();
    logger.info("Chat messages saved successfully", { storyId, chatId });
  } catch (error) {
    logger.error("Error saving chat messages", {
      storyId,
      chatId,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorCode: (error as any).code,
    });
    throw error;
  }
}

/**
 * Get or create a chat session for a story.
 * Returns the chatId of the most recent session, or creates a new one if none exists.
 */
export async function getOrCreateChatSession(
  db: admin.firestore.Firestore,
  storyId: string,
  userId: string
): Promise<string> {
  try {
    const chatsRef = db.collection("stories").doc(storyId).collection("chats");

    // Check if a chat already exists (get most recent)
    const existingChats = await chatsRef
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .limit(1)
      .get();

    if (!existingChats.empty) {
      const chatId = existingChats.docs[0].id;
      logger.info("Found existing chat session", { storyId, chatId });
      return chatId;
    }

    // Create new chat session
    const newChatRef = chatsRef.doc();
    const newChatId = newChatRef.id;

    const newChat: Omit<ChatSession, "id"> = {
      userId,
      storyId,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      messageCount: 0,
    };

    await newChatRef.set({ id: newChatId, ...newChat });
    logger.info("Created new chat session", { storyId, chatId: newChatId });
    return newChatId;
  } catch (error) {
    logger.error("Error getting or creating chat session", {
      storyId,
      userId,
      error,
    });
    throw error;
  }
}
