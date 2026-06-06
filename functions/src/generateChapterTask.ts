/** Cloud Tasks worker that performs chapter generation reliably. */
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { updateJobStatus } from "./jobService";
import { callAgentWithRetry } from "./agentService";
import { getChapterContinuityContext } from "./contextService";
import { ProviderConfig } from "./aiSettings";

const db = admin.firestore();

/**
 * Hard server-side cap on generated chapter length. Mirrors the client-side
 * `WORD_LIMIT` in StoriesRepo so a runaway agent response can't bloat the
 * Firestore doc (and downstream prompts that feed it back as neighbor context).
 */
const MAX_CHAPTER_WORDS = 5000;

/** Truncate to at most `maxWords` words (whitespace-delimited), preserving order. */
function clampWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ");
}

/** Payload enqueued by the generateChapter HTTP enqueuer. */
export interface ChapterTaskPayload {
  jobId: string;
  storyId: string;
  chapterNumber: number;
  /** Float ordering key (source of truth for chapter position). */
  order: number;
  /**
   * When set, generate INTO this existing chapter (update in place) rather than
   * creating a new doc. Prevents duplicate chapters / order collisions when the
   * user regenerates a chapter that has neighbors on both sides.
   */
  chapterId?: string;
  userId?: string;
  providerConfig?: ProviderConfig;
  firebaseToken?: string;
}

/**
 * Background worker for chapter generation.
 *
 * Runs as a proper Cloud Tasks invocation (NOT fire-and-forget after an HTTP
 * response), so the work is guaranteed to run to completion. Cloud Tasks
 * auto-retries on infrastructure failure (crash / OOM / timeout — no 2xx
 * returned). Deterministic application failures are caught and recorded on the
 * job, and we return normally so Cloud Tasks does not pointlessly retry them
 * (`callAgentWithRetry` already handles transient agent errors internally).
 */
export const generateChapterTask = onTaskDispatched(
  {
    retryConfig: { maxAttempts: 3, minBackoffSeconds: 5 },
    rateLimits: { maxConcurrentDispatches: 5 },
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async (req) => {
    await processChapterGeneration(req.data as ChapterTaskPayload);
  },
);

async function processChapterGeneration(
  payload: ChapterTaskPayload,
): Promise<void> {
  const { jobId, storyId, chapterNumber, order } = payload;
  try {
    await updateJobStatus(db, jobId, "processing", 10);

    // Bounded continuity: truncated full text of the immediate neighbors around
    // `order` only (previous chapter + next chapter for mid-story inserts).
    // Payload doesn't grow with story length, which is what previously blew the
    // prompt / produced empty generations on large stories.
    const continuity = await getChapterContinuityContext(db, storyId, order);

    await updateJobStatus(db, jobId, "processing", 30);

    const agentResponse = await callAgentWithRetry(
      "generateChapter",
      {
        storyId,
        chapterNumber,
        order,
        prevChapter: continuity.prevChapter,
        nextChapter: continuity.nextChapter,
      },
      3,
      1000,
      payload.userId,
      payload.providerConfig,
      payload.firebaseToken,
    );

    if (!agentResponse.success || !agentResponse.data) {
      throw new Error(agentResponse.error || "Agent generation failed");
    }

    await updateJobStatus(db, jobId, "processing", 70);

    // Unwrap envelope if the agent returned { success, data: {...} }.
    const rawData = agentResponse.data as Record<string, unknown>;
    const generated = (rawData.data != null ? rawData.data : rawData) as {
      content?: string;
      title?: string;
      summary?: string;
      chapterNumber?: number;
    };

    if (!generated.content || typeof generated.content !== "string") {
      logger.error("Agent response missing content field", {
        agentResponseData: agentResponse.data,
      });
      throw new Error("Agent returned no content");
    }

    const { title, content: rawContent } = extractTitleAndContent(
      generated,
      chapterNumber,
    );

    // Cap length server-side: an over-long response would otherwise bloat the
    // chapter doc and re-inflate future prompts (it's fed back as neighbor
    // context). Truncate to the same word limit the client enforces.
    const content = clampWords(rawContent, MAX_CHAPTER_WORDS);
    if (content !== rawContent) {
      logger.warn(
        `Generated chapter for job ${jobId} exceeded ${MAX_CHAPTER_WORDS} words; truncated.`,
      );
    }

    const summary =
      typeof generated.summary === "string" && generated.summary.trim()
        ? generated.summary.trim()
        : null;

    const chaptersCol = db
      .collection("stories")
      .doc(storyId)
      .collection("chapters");

    // Update the selected chapter in place when chapterId is supplied (no
    // duplicate / no order collision); otherwise create a new chapter doc.
    const chapterRef = payload.chapterId
      ? chaptersCol.doc(payload.chapterId)
      : chaptersCol.doc();

    await chapterRef.set(
      {
        chapterNumber,
        order,
        title,
        content,
        // Rolling summary used for long-range continuity on future generations.
        summary,
        generatedAt: Timestamp.now(),
        ...(payload.chapterId ? {} : { createdAt: Timestamp.now() }),
      },
      { merge: true },
    );

    await updateJobStatus(db, jobId, "completed", 100, {
      storyId,
      chapterId: chapterRef.id,
      chapterNumber,
      title,
    });

    logger.info(
      `Chapter generation completed for job ${jobId}, chapter ${chapterNumber} (order ${order})`,
    );
  } catch (error) {
    logger.error(`Chapter generation failed for job ${jobId}`, error);
    await updateJobStatus(
      db,
      jobId,
      "failed",
      undefined,
      undefined,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * The agent (`_parse_generated`) is the single source of truth for parsing raw
 * LLM output into a structured title/content/summary — it's the only layer that
 * ever sees raw model text. By the time the response reaches this worker it's
 * already structured, so we only apply a persistence-layer default: use the
 * agent's title, or fall back to a numbered title so the Firestore doc always
 * has one.
 */
function extractTitleAndContent(
  generated: { content?: string; title?: string },
  chapterNumber: number,
): { title: string; content: string } {
  return {
    title: generated.title?.trim() || `Chapter ${chapterNumber}`,
    content: generated.content ?? "",
  };
}
