/** Chat message endpoint for AI-powered story assistance. */
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { requireStoryOwnership } from "./authService";
import { callAgentWithRetry } from "./agentService";
import { checkAiAccess } from "./aiSettings";
import { getStoryContext } from "./contextService";
import {
  getChatHistory,
  saveChatMessages,
  getOrCreateChatSession,
} from "./chatService";
import { corsOptions } from "./corsConfig";

/**
 * POST /sendChatMessage
 * Send a chat message with story context for RAG-powered response.
 *
 * Request body:
 * - storyId: string (required, validated by middleware)
 * - chatId?: string (optional, will be created if not provided)
 * - message: string (required)
 * - includeFullContext?: boolean (optional, default: true)
 *
 * Response:
 * - response: string (AI-generated response)
 * - chatId: string (chat session ID)
 * - contextUsed: { chapters, characters, plots, places }
 */
export const sendChatMessage = onRequest(
  corsOptions,
  requireStoryOwnership(async (request, response, userId, storyId) => {
    try {
      const access = await checkAiAccess(userId);

      const { chatId, message, includeFullContext = true } = request.body;

      // Validate message
      if (!message || typeof message !== "string" || message.trim() === "") {
        response.status(400).json({
          error: "message is required and must be a non-empty string",
        });
        return;
      }

      const db = admin.firestore();

      // Get or create chat session
      let sessionId = chatId;
      if (!sessionId) {
        sessionId = await getOrCreateChatSession(db, storyId, userId);
        logger.info("Created new chat session", { storyId, chatId: sessionId });
      }

      // Fetch story context
      let context = {};
      if (includeFullContext) {
        try {
          context = await getStoryContext(db, storyId);
          logger.info("Fetched story context", {
            storyId,
            chapters: (context as any).chapters?.length || 0,
            characters: (context as any).characters?.length || 0,
            plots: (context as any).plots?.length || 0,
            places: (context as any).places?.length || 0,
          });
        } catch (contextError) {
          logger.error("Error fetching story context", {
            storyId,
            error: contextError,
          });
          // Continue with empty context if fetch fails
          context = {};
        }
      }

      // Fetch chat history (last 10 messages for conversational context)
      const chatHistory = await getChatHistory(db, storyId, sessionId, 10);
      logger.info("Fetched chat history", {
        storyId,
        chatId: sessionId,
        messageCount: chatHistory.length,
      });

      // Call Python agent with retry
      const agentResponse = await callAgentWithRetry("chatWithContext", {
        storyId,
        userId,
        message: message.trim(),
        context,
        chatHistory: chatHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      }, 3, 1000, userId, access.providerConfig ?? undefined);

      if (!agentResponse.success || !agentResponse.data) {
        logger.error("Agent failed to generate chat response", {
          storyId,
          chatId: sessionId,
          error: agentResponse.error,
        });
        response.status(500).json({
          error: agentResponse.error || "Failed to generate chat response",
          details: agentResponse.error,
        });
        return;
      }

      const responseData = (agentResponse.data as any).data;

      // Create context snapshot for tracking
      const contextSnapshot = includeFullContext
        ? {
            chapterIds: (context as any).chapters?.map((c: any) => c.id) || [],
            characterIds:
              (context as any).characters?.map((c: any) => c.id) || [],
            plotIds: (context as any).plots?.map((p: any) => p.id) || [],
            placeIds: (context as any).places?.map((p: any) => p.id) || [],
          }
        : undefined;

      // Save user message and assistant response to Firestore
      await saveChatMessages(
        db,
        storyId,
        sessionId,
        userId,
        message.trim(),
        responseData.response,
        contextSnapshot
      );

      logger.info("Chat message processed successfully", {
        storyId,
        chatId: sessionId,
        messageLength: message.length,
        responseLength: responseData.response.length,
      });

      // Return response
      response.status(200).json({
        response: responseData.response,
        chatId: sessionId,
        contextUsed: responseData.contextUsed || {
          chapters: 0,
          characters: 0,
          plots: 0,
          places: 0,
        },
      });
    } catch (error) {
      logger.error("Error in sendChatMessage", {
        error,
        storyId,
        userId,
      });
      response.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  })
);
