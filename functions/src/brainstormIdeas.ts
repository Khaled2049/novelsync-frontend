/** Brainstorming endpoints (synchronous). */
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { requireStoryOwnership } from "./authService";
import { callAgentWithRetry } from "./agentService";
import { checkAndIncrementAiUsage } from "./aiUsageService";
import { corsOptions } from "./corsConfig";

/**
 * POST /brainstormIdeas - Generate brainstorming ideas (synchronous).
 */
export const brainstormIdeas = onRequest(
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

      const { type, prompt, count } = request.body;

      if (!type || typeof type !== "string") {
        response.status(400).json({
          error:
            "type is required and must be one of: characters, plots, places, themes",
        });
        return;
      }

      const validTypes = ["characters", "plots", "places", "themes"];
      if (!validTypes.includes(type)) {
        response.status(400).json({
          error: `type must be one of: ${validTypes.join(", ")}`,
        });
        return;
      }

      const ideaCount = count && typeof count === "number" ? count : 5;

      // Call agent synchronously
      const agentResponse = await callAgentWithRetry("brainstormIdeas", {
        storyId,
        type,
        prompt,
        count: ideaCount,
      });

      if (!agentResponse.success || !agentResponse.data) {
        response.status(500).json({
          error: "Failed to generate ideas",
          details: agentResponse.error,
        });
        return;
      }

      response.status(200).json(agentResponse.data);
    } catch (error) {
      logger.error("Error in brainstormIdeas", error);
      response.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  })
);

/**
 * POST /brainstormCharacter - Generate character ideas (synchronous).
 */
export const brainstormCharacter = onRequest(
  corsOptions,
  requireStoryOwnership(async (request, response, userId, storyId) => {
    try {
      const { role, archetype } = request.body;

      // Call agent synchronously
      const agentResponse = await callAgentWithRetry("brainstormCharacter", {
        storyId,
        role,
        archetype,
      });

      if (!agentResponse.success || !agentResponse.data) {
        response.status(500).json({
          error: "Failed to generate character ideas",
          details: agentResponse.error,
        });
        return;
      }

      response.status(200).json(agentResponse.data);
    } catch (error) {
      logger.error("Error in brainstormCharacter", error);
      response.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  })
);

/**
 * POST /brainstormPlot - Generate plot ideas (synchronous).
 */
export const brainstormPlot = onRequest(
  corsOptions,
  requireStoryOwnership(async (request, response, userId, storyId) => {
    try {
      const { plotType } = request.body;

      const validPlotTypes = ["conflict", "twist", "subplot", "development"];
      const finalPlotType =
        plotType && validPlotTypes.includes(plotType) ? plotType : "conflict";

      // Call agent synchronously
      const agentResponse = await callAgentWithRetry("brainstormPlot", {
        storyId,
        plotType: finalPlotType,
      });

      if (!agentResponse.success || !agentResponse.data) {
        response.status(500).json({
          error: "Failed to generate plot ideas",
          details: agentResponse.error,
        });
        return;
      }

      response.status(200).json(agentResponse.data);
    } catch (error) {
      logger.error("Error in brainstormPlot", error);
      response.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  })
);
