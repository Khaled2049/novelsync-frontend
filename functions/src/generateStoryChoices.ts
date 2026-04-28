/** AI-powered interactive storytelling: generates an opening scene or narrative direction choices. */
import { onRequest } from "firebase-functions/v2/https";
import { callAgentWithRetry } from "./agentService";
import { requireStoryOwnership } from "./authService";
import * as logger from "firebase-functions/logger";
import { checkAndIncrementAiUsage } from "./aiUsageService";
import { corsOptions } from "./corsConfig";

const VALID_MODES = ["opening", "continuation", "ending"] as const;
type StoryChoicesMode = (typeof VALID_MODES)[number];

/**
 * POST /generateStoryChoices
 *
 * Generates an opening scene (first call) or continuation choices (subsequent calls)
 * for the interactive co-write storytelling mode. Requires story ownership.
 *
 * Request body:
 *   storyId: string         — picked up by requireStoryOwnership
 *   mode: "opening" | "continuation"
 *   currentContent?: string — HTML content already in editor (empty for opening)
 *   chapterId?: string
 *
 * Response:
 *   openingScene?: string   — only present when mode === "opening"
 *   choices: { label: string, sceneText: string }[]  — 3–4 items
 */
export const generateStoryChoices = onRequest(
  corsOptions,
  requireStoryOwnership(async (request, response, userId, storyId) => {
    try {
      // ── Quota check ─────────────────────────────────────────────────────────
      const usageCheck = await checkAndIncrementAiUsage(userId);
      if (!usageCheck.allowed) {
        response.status(429).json({
          error: "Daily AI usage limit reached. Please try again tomorrow.",
          details: `You have used ${usageCheck.currentUsage} out of 10 daily AI uses.`,
        });
        return;
      }

      // ── Validate request ────────────────────────────────────────────────────
      const { mode, currentContent, chapterId, turnCount } = request.body as {
        mode?: string;
        currentContent?: string;
        chapterId?: string;
        turnCount?: number;
      };

      if (!mode || !VALID_MODES.includes(mode as StoryChoicesMode)) {
        response.status(400).json({
          error: `mode must be one of: ${VALID_MODES.join(", ")}`,
        });
        return;
      }

      // ── Call agent ──────────────────────────────────────────────────────────
      const agentResponse = await callAgentWithRetry("generateStoryChoices", {
        storyId,
        userId,
        mode,
        currentContent: currentContent ?? "",
        chapterId,
        turnCount: turnCount ?? 0,
      });

      if (!agentResponse.success || !agentResponse.data) {
        response.status(500).json({
          error: "Failed to generate story choices",
          details: agentResponse.error,
        });
        return;
      }

      response.status(200).json(agentResponse.data);
    } catch (error) {
      logger.error("Error in generateStoryChoices", error);
      response.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }),
);
