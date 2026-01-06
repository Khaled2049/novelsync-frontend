/** Context management endpoints. */
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { requireStoryOwnership } from "./authService";
import { getStoryContext, updateContextElement } from "./contextService";
import { corsOptions } from "./corsConfig";

const db = admin.firestore();

/**
 * GET /getStoryContext - Retrieve all context for a story.
 */
export const getStoryContextEndpoint = onRequest(
  corsOptions,
  requireStoryOwnership(async (request, response, userId, storyId) => {
    try {
      const context = await getStoryContext(db, storyId);

      response.status(200).json(context);
    } catch (error) {
      logger.error("Error fetching story context", error);
      response.status(500).json({
        error: "Failed to fetch story context",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  })
);

/**
 * POST /updateContext - Update story context elements.
 */
export const updateContext = onRequest(
  corsOptions,
  requireStoryOwnership(async (request, response, userId, storyId) => {
    try {
      const { type, elementId, data } = request.body;

      if (!type || !elementId || !data) {
        response.status(400).json({
          error: "type, elementId, and data are required",
        });
        return;
      }

      const validTypes = ["character", "place", "plot"];
      if (!validTypes.includes(type)) {
        response.status(400).json({
          error: `type must be one of: ${validTypes.join(", ")}`,
        });
        return;
      }

      await updateContextElement(db, storyId, type, elementId, data);

      response.status(200).json({
        success: true,
        message: `${type} updated successfully`,
      });
    } catch (error) {
      logger.error("Error updating context", error);
      response.status(500).json({
        error: "Failed to update context",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  })
);
