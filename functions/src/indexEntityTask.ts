/**
 * Debounced metadata-entity (re)indexing worker — the character/place/plot
 * counterpart to indexChapterTask. Reads the entity's CURRENT fields and asks the
 * agent to embed them, so chat can retrieve a character's backstory, a place's
 * description, or a plot's events on demand (not just their names).
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

export type EntityKind = "character" | "place" | "plot";

export interface IndexEntityTaskPayload {
  storyId: string;
  kind: EntityKind;
  entityId: string;
}

/** Firestore subcollection name for an entity kind. */
function collectionFor(kind: EntityKind): string {
  return `${kind}s`; // character → characters, place → places, plot → plots
}

export const indexEntityTask = onTaskDispatched(
  {
    retryConfig: { maxAttempts: 3, minBackoffSeconds: 10 },
    rateLimits: { maxConcurrentDispatches: 3 },
    memory: "256MiB",
    timeoutSeconds: 300,
  },
  async (req) => {
    const { storyId, kind, entityId } = req.data as IndexEntityTaskPayload;
    const ownerId = await resolveOwnerId(storyId);

    const snap = await db
      .collection("stories")
      .doc(storyId)
      .collection(collectionFor(kind))
      .doc(entityId)
      .get();

    // Deleted between enqueue and run → drop any chunks.
    if (!snap.exists) {
      const res = await callAgent(
        "deleteEntityChunks",
        { storyId, entityId },
        ownerId,
      );
      if (!res.success) throw new Error(res.error || "deleteEntityChunks failed");
      return;
    }

    // Meter the embedding pass per owner (the delete path above is never gated).
    // Over budget → skip and RETURN, not throw, to avoid Cloud Tasks retry
    // amplification. See indexChapterTask for the full rationale.
    if (!(await consumeIndexingBudget(ownerId))) {
      logger.warn("indexing budget exceeded; skipping entity embed", {
        storyId,
        kind,
        entityId,
        ownerId,
      });
      return;
    }

    const res = await callAgent(
      "indexEntity",
      { storyId, kind, entityId, data: snap.data() ?? {} },
      ownerId,
    );
    if (!res.success) {
      logger.warn("indexEntity failed; will retry", { storyId, kind, entityId, error: res.error });
      throw new Error(res.error || "indexEntity failed");
    }

    logger.info("Entity indexed", { storyId, kind, entityId });
  },
);
