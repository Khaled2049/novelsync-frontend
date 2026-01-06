/** Job status and management endpoints. */
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { requireAuth, requireStoryOwnership } from "./authService";
import { getJob, getStoryJobs } from "./jobService";
import { corsOptions } from "./corsConfig";

const db = admin.firestore();

/**
 * GET /jobStatus/:jobId - Check generation job status.
 */
export const getJobStatus = onRequest(
  corsOptions,
  requireAuth(async (request, response, userId) => {
    try {
      const jobId = request.path.split("/").pop();

      if (!jobId) {
        response.status(400).json({ error: "jobId is required" });
        return;
      }

      const job = await getJob(db, jobId);

      if (!job) {
        response.status(404).json({ error: "Job not found" });
        return;
      }

      // Verify user owns the story
      const storyDoc = await db.collection("stories").doc(job.storyId).get();
      if (!storyDoc.exists) {
        response.status(404).json({ error: "Story not found" });
        return;
      }

      const storyData = storyDoc.data();
      if (storyData?.userId !== userId) {
        response.status(403).json({ error: "Forbidden" });
        return;
      }

      response.status(200).json(job);
    } catch (error) {
      logger.error("Error fetching job status", error);
      response.status(500).json({
        error: "Failed to fetch job status",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  })
);

/**
 * GET /storyJobs/:storyId - Get all jobs for a story.
 */
export const getStoryJobsEndpoint = onRequest(
  corsOptions,
  requireStoryOwnership(async (request, response, userId, storyId) => {
    try {
      const jobs = await getStoryJobs(db, storyId);

      response.status(200).json({ jobs });
    } catch (error) {
      logger.error("Error fetching story jobs", error);
      response.status(500).json({
        error: "Failed to fetch story jobs",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  })
);
