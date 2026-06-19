/**
 * Story-write trigger — maintains a denormalized `storyCount` on the owner's user
 * doc so firestore.rules can enforce a per-user story cap at creation time (rules
 * can't COUNT a collection themselves). This bounds the total embedding/storage cost
 * a single account can drive, on top of the per-day indexing budget (usageBudget.ts).
 *
 * Only create/delete move the counter; content/metadata updates are ignored. The
 * counter is eventually-consistent with creation (the rule reads it, then this
 * trigger bumps it), so a rapid burst can overshoot the cap by a small margin — a
 * soft cap by design; the indexing budget is the hard cost ceiling.
 */
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

export const onStoryWrite = onDocumentWritten(
  { document: "stories/{storyId}", memory: "256MiB", timeoutSeconds: 60 },
  async (event) => {
    const beforeExists = event.data?.before.exists ?? false;
    const afterExists = event.data?.after.exists ?? false;

    // Created → +1; deleted → -1; update → no-op.
    let delta = 0;
    let ownerId: string | undefined;
    if (!beforeExists && afterExists) {
      delta = 1;
      ownerId = event.data?.after.data()?.userId as string | undefined;
    } else if (beforeExists && !afterExists) {
      delta = -1;
      ownerId = event.data?.before.data()?.userId as string | undefined;
    } else {
      return;
    }

    if (!ownerId) return;

    try {
      await getFirestore()
        .collection("users")
        .doc(ownerId)
        .set({ storyCount: FieldValue.increment(delta) }, { merge: true });
    } catch (err) {
      logger.error("storyCount update failed", { ownerId, delta, err });
    }
  },
);
