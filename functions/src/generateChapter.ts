/** Chapter generation endpoint (asynchronous). */
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { requireStoryOwnership } from "./authService";
import { createJob, updateJobStatus } from "./jobService";
import { callAgentWithRetry } from "./agentService";
import { getStoryContext } from "./contextService";
import { corsOptions } from "./corsConfig";

const db = admin.firestore();

/**
 * POST /generateChapter - Start asynchronous chapter generation.
 */
export const generateChapter = onRequest(
  corsOptions,
  requireStoryOwnership(async (request, response, userId, storyId) => {
    try {
      const { chapterNumber } = request.body;

      if (!chapterNumber || typeof chapterNumber !== "number") {
        response
          .status(400)
          .json({ error: "chapterNumber is required and must be a number" });
        return;
      }

      // Create job
      const jobId = await createJob(db, storyId, "generateChapter", {
        chapterNumber,
      });

      // Start processing asynchronously
      processChapterGeneration(jobId, storyId, chapterNumber).catch((error) => {
        logger.error(
          `Error in background chapter generation for job ${jobId}`,
          error
        );
      });

      response.status(202).json({
        jobId,
        status: "queued",
        message: "Chapter generation started",
      });
    } catch (error) {
      logger.error("Error starting chapter generation", error);
      response.status(500).json({
        error: "Failed to start chapter generation",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  })
);

/**
 * Background processing for chapter generation.
 */
async function processChapterGeneration(
  jobId: string,
  storyId: string,
  chapterNumber: number
): Promise<void> {
  try {
    await updateJobStatus(db, jobId, "processing", 0);

    // Get story context to fetch previous chapters
    const context = await getStoryContext(db, storyId);
    const previousChapters = context.chapters
      .filter((ch) => (ch.chapterNumber || 0) < chapterNumber)
      .map((ch) => ({
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        content: ch.content,
      }));

    await updateJobStatus(db, jobId, "processing", 25);

    // Call agent to generate chapter
    const agentResponse = await callAgentWithRetry("generateChapter", {
      storyId,
      chapterNumber,
      previousChapters,
    });

    if (!agentResponse.success || !agentResponse.data) {
      throw new Error(agentResponse.error || "Agent generation failed");
    }

    await updateJobStatus(db, jobId, "processing", 75);

    const generatedContent = agentResponse.data as {
      content: string;
      chapterNumber: number;
    };

    // Parse chapter content (simple extraction - could be enhanced)
    // Extract title if present
    const contentLines = generatedContent.content.split("\n");
    let title = `Chapter ${chapterNumber}`;
    let content = generatedContent.content;

    // Try to extract title from format "Title: [title]"
    const titleMatch = contentLines.find((line) =>
      line.toLowerCase().startsWith("title:")
    );
    if (titleMatch) {
      title = titleMatch.split(":")[1]?.trim() || title;
      const titleIndex = contentLines.indexOf(titleMatch);
      content = contentLines
        .slice(titleIndex + 1)
        .join("\n")
        .trim();
    }

    // Save chapter to Firestore
    const chapterRef = db
      .collection("stories")
      .doc(storyId)
      .collection("chapters")
      .doc();

    await chapterRef.set({
      chapterNumber,
      title,
      content,
      generatedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    });

    await updateJobStatus(db, jobId, "completed", 100, {
      storyId,
      chapterId: chapterRef.id,
      chapterNumber,
      title,
    });

    logger.info(
      `Chapter generation completed for job ${jobId}, chapter ${chapterNumber}`
    );
  } catch (error) {
    logger.error(`Chapter generation failed for job ${jobId}`, error);
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
