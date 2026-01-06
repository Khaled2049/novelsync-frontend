/** Job management service for asynchronous operations. */
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface Job {
  id: string;
  storyId: string;
  type: "generateStory" | "generateChapter" | "brainstorm";
  status: JobStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  progress?: number;
  result?: Record<string, unknown>;
  error?: string;
  parameters: Record<string, unknown>;
}

/**
 * Create a new job in Firestore.
 */
export async function createJob(
  db: admin.firestore.Firestore,
  storyId: string,
  type: Job["type"],
  parameters: Record<string, unknown>
): Promise<string> {
  const now = Timestamp.now();
  const jobData: Omit<Job, "id"> = {
    storyId,
    type,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    parameters,
  };

  const jobRef = await db.collection("jobs").add(jobData);
  logger.info(`Created job ${jobRef.id} for story ${storyId}, type: ${type}`);

  return jobRef.id;
}

/**
 * Update job status.
 */
export async function updateJobStatus(
  db: admin.firestore.Firestore,
  jobId: string,
  status: JobStatus,
  progress?: number,
  result?: Record<string, unknown>,
  error?: string
): Promise<void> {
  const updateData: Partial<Job> = {
    status,
    updatedAt: Timestamp.now(),
  };

  if (status === "processing" && !updateData.startedAt) {
    updateData.startedAt = Timestamp.now();
  }

  if (status === "completed" || status === "failed") {
    updateData.completedAt = Timestamp.now();
  }

  if (progress !== undefined) {
    updateData.progress = progress;
  }

  if (result) {
    updateData.result = result;
  }

  if (error) {
    updateData.error = error;
  }

  await db.collection("jobs").doc(jobId).update(updateData);
  logger.info(`Updated job ${jobId} to status: ${status}`);
}

/**
 * Get job by ID.
 */
export async function getJob(
  db: admin.firestore.Firestore,
  jobId: string
): Promise<Job | null> {
  const jobDoc = await db.collection("jobs").doc(jobId).get();

  if (!jobDoc.exists) {
    return null;
  }

  return {
    id: jobDoc.id,
    ...jobDoc.data(),
  } as Job;
}

/**
 * Get all jobs for a story.
 */
export async function getStoryJobs(
  db: admin.firestore.Firestore,
  storyId: string
): Promise<Job[]> {
  const jobsSnapshot = await db
    .collection("jobs")
    .where("storyId", "==", storyId)
    .orderBy("createdAt", "desc")
    .get();

  return jobsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Job[];
}
