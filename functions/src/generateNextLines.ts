import { onRequest } from "firebase-functions/v2/https";
import { callAgentWithRetry } from "./agentService";
import { requireStoryOwnership } from "./authService";
import * as logger from "firebase-functions/logger";
import { checkAndIncrementAiUsage } from "./aiUsageService";
import { corsOptions } from "./corsConfig";

export const generateNextLines = onRequest(
  corsOptions,
  requireStoryOwnership(async (request, response, userId, storyId) => {
    try {
      // Check and increment AI usage
      const usageCheck = await checkAndIncrementAiUsage(userId);
      if (!usageCheck.allowed) {
        response.status(429).json({
          error: "Daily AI usage limit reached. Please try again tomorrow.",
          details: `You have used ${usageCheck.currentUsage} out of 10 daily AI uses.`,
        });
        return;
      }

      const { content, cursorPosition, chapterId } = request.body;

      // Validate required parameters
      if (!content || typeof content !== "string") {
        response.status(400).json({
          error: "content is required and must be a string",
        });
        return;
      }

      if (cursorPosition === undefined || typeof cursorPosition !== "number") {
        response.status(400).json({
          error: "cursorPosition is required and must be a number",
        });
        return;
      }

      // Call agent synchronously
      const agentResponse = await callAgentWithRetry("generateNextLines", {
        storyId,
        content,
        cursorPosition,
        chapterId, // Optional: helps identify which chapter for better context
      });

      if (!agentResponse.success || !agentResponse.data) {
        response.status(500).json({
          error: "Failed to generate next lines",
          details: agentResponse.error,
        });
        return;
      }

      response.status(200).json(agentResponse.data);
    } catch (error) {
      logger.error("Error in generateNextLines", error);
      response.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  })
);
