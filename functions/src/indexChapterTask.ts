/**
 * Debounced chapter (re)indexing worker.
 *
 * The chapter-write trigger does NOT embed inline — autosave fires every ~3s, so
 * inline embedding would re-chunk + re-embed a chapter dozens of times per
 * session (wasted embeddings, ~40 chunk writes each, and rate-limit contention
 * with the user's real AI calls). Instead the trigger enqueues a task here with a
 * time-bucketed dedup id, so a burst of saves collapses into ~one embedding pass
 * per debounce window. By the time this runs it reads the chapter's CURRENT
 * content, so intermediate keystrokes never get embedded.
 *
 * See chat-scaling-design.md.
 */
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { callAgent } from "./agentService";
import { resolveOwnerId } from "./indexShared";
import { consumeIndexingBudget } from "./usageBudget";

const db = admin.firestore();

export interface IndexChapterTaskPayload {
  storyId: string;
  chapterId: string;
}

export const indexChapterTask = onTaskDispatched(
  {
    retryConfig: { maxAttempts: 3, minBackoffSeconds: 10 },
    rateLimits: { maxConcurrentDispatches: 3 },
    memory: "256MiB",
    timeoutSeconds: 300,
  },
  async (req) => {
    const { storyId, chapterId } = req.data as IndexChapterTaskPayload;
    const ownerId = await resolveOwnerId(storyId);

    const chapterSnap = await db
      .collection("stories")
      .doc(storyId)
      .collection("chapters")
      .doc(chapterId)
      .get();

    // Deleted between enqueue and run → make sure no stale chunks linger.
    if (!chapterSnap.exists) {
      const res = await callAgent(
        "deleteChapterChunks",
        { storyId, chapterId },
        ownerId,
      );
      if (!res.success) {
        throw new Error(res.error || "deleteChapterChunks failed");
      }
      return;
    }

    // Meter the embedding pass per owner (deletes above are never gated — cleanup
    // must always run). Over budget → skip and RETURN, don't throw: a thrown error
    // would make Cloud Tasks retry up to maxAttempts, amplifying the very cost the
    // budget exists to cap. The next edit's debounced task retries on a fresh day.
    if (!(await consumeIndexingBudget(ownerId))) {
      logger.warn("indexing budget exceeded; skipping chapter embed", {
        storyId,
        chapterId,
        ownerId,
      });
      return;
    }

    const data = chapterSnap.data() || {};
    const res = await callAgent(
      "indexChapter",
      {
        storyId,
        chapterId,
        title: data.title ?? "",
        content: data.content ?? "",
        chapterNumber: data.chapterNumber ?? null,
      },
      ownerId,
    );

    // Throw on failure so Cloud Tasks retries transient errors (embedding API
    // hiccup, brief rate-limit). A permanent failure simply re-runs on the next
    // edit's debounced task.
    if (!res.success) {
      logger.warn("indexChapter failed; will retry", { storyId, chapterId, error: res.error });
      throw new Error(res.error || "indexChapter failed");
    }

    logger.info("Chapter indexed", { storyId, chapterId });
  },
);
