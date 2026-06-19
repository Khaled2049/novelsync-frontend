/** Shared helpers for the content-indexing triggers (chapters + entities). */
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { getFunctions } from "firebase-admin/functions";

const db = admin.firestore();

/**
 * Debounce window for re-embedding. The editor autosaves every ~3s; we collapse a
 * burst of saves into ~one embedding pass by giving every enqueue within the same
 * window the same dedup id (Cloud Tasks drops the duplicates) and scheduling the
 * task that far out. The task reads current content when it runs, so the latest
 * text always wins and intermediate edits are never embedded.
 *
 * Prod uses a wider 5-min window (cheaper: fewer passes per actively-edited doc,
 * lighter on the per-user indexing budget) at the cost of retrieval freshness. Local
 * keeps a tighter 2-min window so the debounce/index cycle is quicker to observe
 * while developing.
 */
export const INDEX_DEBOUNCE_SECONDS =
  process.env.FUNCTIONS_EMULATOR === "true" ? 120 : 300;

/**
 * The Firestore emulator has no native `find_nearest`, and we removed the
 * brute-force fallback — so retrieval can't work locally and any embedded chunks
 * would be unreadable. Skip the vector-index pass (embedding + chunk writes + status)
 * in the emulator and just log; the cheap chapterIndex roster still builds, so the
 * slim chat context keeps working locally. Prod is unaffected.
 */
export const VECTOR_INDEX_DISABLED = process.env.FUNCTIONS_EMULATOR === "true";

/** Resolve a user_id for the agent call (required as the billing/rate-limit key). */
export async function resolveOwnerId(storyId: string): Promise<string> {
  try {
    const story = await db.collection("stories").doc(storyId).get();
    return (story.data()?.userId as string) || "system-indexer";
  } catch {
    return "system-indexer";
  }
}

/** Current debounce bucket — same value for all saves within one window. */
export function debounceBucket(): number {
  return Math.floor(Date.now() / 1000 / INDEX_DEBOUNCE_SECONDS);
}

/**
 * Enqueue a debounced task. `dedupId` should embed the current bucket so repeated
 * saves in one window coalesce into a single task. Swallows the expected
 * ALREADY_EXISTS rejection (that's the debounce working).
 */
export async function enqueueDebounced(
  queueName: string,
  dedupId: string,
  payload: object,
): Promise<void> {
  try {
    await getFunctions()
      .taskQueue(queueName)
      .enqueue(payload, { id: dedupId, scheduleDelaySeconds: INDEX_DEBOUNCE_SECONDS });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ALREADY_EXISTS") || msg.includes("409")) return;
    logger.warn("enqueueDebounced failed", { queueName, dedupId, error: msg });
  }
}
