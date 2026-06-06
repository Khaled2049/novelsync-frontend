/** Chapter generation endpoint (asynchronous, Cloud Tasks backed). */
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { getFunctions } from "firebase-admin/functions";
import { requireStoryOwnership } from "./authService";
import { createJob } from "./jobService";
import { checkAiAccess, corsWithEncryption } from "./aiSettings";
import { ChapterTaskPayload } from "./generateChapterTask";

const db = admin.firestore();

const isLocalDevelopment = process.env.FUNCTIONS_EMULATOR === "true";

/**
 * POST /generateChapter - Validate, create a job, and enqueue a Cloud Task.
 *
 * The actual generation runs in `generateChapterTask` (onTaskDispatched) so the
 * work survives the HTTP response and is retried by Cloud Tasks on failure.
 */
export const generateChapter = onRequest(
  corsWithEncryption,
  requireStoryOwnership(async (request, response, userId, storyId, idToken) => {
    try {
      const access = await checkAiAccess(userId);
      if (!access.allowed) {
        response.status(429).json({
          error: access.reason || "Daily AI quota exceeded",
        });
        return;
      }

      const { chapterNumber, order, chapterId } = request.body;

      if (!chapterNumber || typeof chapterNumber !== "number") {
        response
          .status(400)
          .json({ error: "chapterNumber is required and must be a number" });
        return;
      }

      // Float ordering key is the source of truth for chapter position. A
      // mid-story insert passes a fractional order (e.g. 2.5) so it never
      // collides with neighboring chapters. Fall back to chapterNumber for
      // older clients.
      const resolvedOrder =
        typeof order === "number" ? order : chapterNumber;

      const jobId = await createJob(
        db,
        storyId,
        "generateChapter",
        {
          chapterNumber,
          order: resolvedOrder,
        },
        userId,
      );

      const payload: ChapterTaskPayload = {
        jobId,
        storyId,
        chapterNumber,
        order: resolvedOrder,
        ...(typeof chapterId === "string" && chapterId
          ? { chapterId }
          : {}),
        userId,
        providerConfig: access.providerConfig ?? undefined,
        firebaseToken: idToken,
      };

      await enqueueChapterTask(payload);

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
  }),
);

/**
 * Enqueue the chapter generation task. Uses the Cloud Tasks queue managed by
 * the `generateChapterTask` onTaskDispatched function (also emulated by the
 * Firebase emulator in local development).
 */
async function enqueueChapterTask(payload: ChapterTaskPayload): Promise<void> {
  const queue = getFunctions().taskQueue("generateChapterTask");
  await queue.enqueue(payload, {
    // Keep the task short-lived; the worker itself runs up to 540s once dispatched.
    dispatchDeadlineSeconds: 600,
  });
  logger.info(
    `Enqueued chapter task for job ${payload.jobId}` +
      (isLocalDevelopment ? " (emulator)" : ""),
  );
}
