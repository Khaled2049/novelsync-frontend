/** Story generation endpoint (asynchronous). */
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { requireStoryOwnership } from "./authService";
import { createJob, updateJobStatus } from "./jobService";
import { callAgentWithRetry } from "./agentService";
import { corsOptions } from "./corsConfig";

const db = admin.firestore();

/**
 * POST /generateStory - Start asynchronous story generation.
 */
export const generateStory = onRequest(
  corsOptions,
  requireStoryOwnership(async (request, response, userId, storyId) => {
    try {
      const { genre, tone, length } = request.body;

      // Create job
      const jobId = await createJob(db, storyId, "generateStory", {
        genre,
        tone,
        length,
      });

      // Start processing asynchronously (don't await)
      processStoryGeneration(jobId, storyId, { genre, tone, length }).catch(
        (error) => {
          logger.error(
            `Error in background story generation for job ${jobId}`,
            error
          );
        }
      );

      response.status(202).json({
        jobId,
        status: "queued",
        message: "Story generation started",
      });
    } catch (error) {
      logger.error("Error starting story generation", error);
      response.status(500).json({
        error: "Failed to start story generation",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  })
);

/**
 * Background processing for story generation.
 */
async function processStoryGeneration(
  jobId: string,
  storyId: string,
  options: { genre?: string; tone?: string; length?: string }
): Promise<void> {
  try {
    await updateJobStatus(db, jobId, "processing", 0);

    // Call agent to generate story
    const agentResponse = await callAgentWithRetry("generateStory", {
      storyId,
      genre: options.genre,
      tone: options.tone,
      length: options.length,
    });

    if (!agentResponse.success || !agentResponse.data) {
      throw new Error(agentResponse.error || "Agent generation failed");
    }

    const pythonResponse = agentResponse.data as {
      success?: boolean;
      data?: {
        content?: string;
        metadata?: Record<string, unknown>;
      };
      error?: string | null;
    };

    // Extract the actual content object from the nested structure
    if (!pythonResponse.data) {
      throw new Error("Agent response missing nested data field");
    }

    const generatedContent = pythonResponse.data as {
      content?: string;
      metadata?: Record<string, unknown>;
    };

    // log out generated content
    logger.info(`Generated content for job ${jobId}:`, generatedContent);

    // Validate that content exists
    if (!generatedContent.content) {
      throw new Error("Agent response missing content field");
    }

    // Build update object, filtering out undefined values
    const updateData: Record<string, unknown> = {
      generatedContent: generatedContent.content,
      generatedAt: Timestamp.now(),
    };

    // Add metadata if it exists and filter out undefined values
    if (generatedContent.metadata) {
      Object.entries(generatedContent.metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value;
        }
      });
    }

    // Parse and save story content
    await db.collection("stories").doc(storyId).update(updateData);

    await updateJobStatus(db, jobId, "completed", 100, {
      storyId,
      content: generatedContent.content,
    });

    logger.info(`Story generation completed for job ${jobId}`);
  } catch (error) {
    logger.error(`Story generation failed for job ${jobId}`, error);
    await updateJobStatus(
      db,
      jobId,
      "failed",
      undefined,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  }
}
