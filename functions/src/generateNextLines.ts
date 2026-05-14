import { onRequest } from "firebase-functions/v2/https";
import { callAgentWithRetry } from "./agentService";
import { requireStoryOwnership } from "./authService";
import * as logger from "firebase-functions/logger";
import { checkAiAccess } from "./aiSettings";
import { corsOptions } from "./corsConfig";

export const generateNextLines = onRequest(
  corsOptions,
  requireStoryOwnership(async (request, response, userId, storyId) => {
    try {
      const access = await checkAiAccess(userId);

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
        chapterId,
      }, 3, 1000, userId, access.providerConfig ?? undefined);

      if (!agentResponse.success || !agentResponse.data) {
        response.status(500).json({
          error: agentResponse.error || "Failed to generate next lines",
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
