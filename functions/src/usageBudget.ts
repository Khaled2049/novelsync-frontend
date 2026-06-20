/**
 * Per-user daily usage budgets, backed by a transactional counter on the user doc.
 *
 * One generic helper drives every budget so they share the same atomic
 * read-modify-write and fail-closed semantics. Used for:
 *  - the AI quota (chat/generation) — see consumePlatformDailyQuota in aiSettings.ts
 *  - the indexing budget (write-triggered embedding) — see consumeIndexingBudget below
 *
 * Each budget stores a usage count + the date it applies to on `users/{uid}`; the
 * count resets the first time it is consumed on a new UTC day.
 */
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

interface DailyBudgetSpec {
  /** Numeric usage field on the user doc, e.g. "aiUsage". */
  usageField: string;
  /** ISO date (YYYY-MM-DD) field paired with usageField, e.g. "lastAiUsageDate". */
  dateField: string;
  /** Inclusive daily ceiling. */
  limit: number;
}

/**
 * Atomically consume one unit of a daily budget for a user. Returns true if the
 * unit was granted (and recorded), false if the user is already at the limit.
 *
 * Fails CLOSED: if the transaction errors (e.g. Firestore unavailable) we return
 * false so an outage can't hand out unlimited paid work.
 */
export async function consumeDailyBudget(
  userId: string,
  spec: DailyBudgetSpec,
): Promise<boolean> {
  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);
  const today = new Date().toISOString().split("T")[0];

  try {
    return await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const data = userSnap.data() || {};
      const lastDate =
        typeof data[spec.dateField] === "string" ? data[spec.dateField] : "";
      const priorUsage =
        typeof data[spec.usageField] === "number" ? data[spec.usageField] : 0;
      const todayUsage = lastDate === today ? priorUsage : 0;

      if (todayUsage >= spec.limit) {
        return false;
      }

      tx.set(
        userRef,
        {
          [spec.usageField]: todayUsage + 1,
          [spec.dateField]: today,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return true;
    });
  } catch (error) {
    logger.error("consumeDailyBudget failed", {
      userId,
      usageField: spec.usageField,
      error,
    });
    return false;
  }
}

/** Daily ceiling for write-triggered (re)indexing passes. Override with MAX_INDEX_USAGE. */
function getIndexingBudgetLimit(): number {
  const parsed = Number.parseInt(process.env.MAX_INDEX_USAGE || "300", 10);
  if (Number.isNaN(parsed) || parsed <= 0) return 300;
  return parsed;
}

/**
 * Consume one indexing unit for a story owner. Each unit is one debounced embedding
 * pass (a chapter or entity (re)index), NOT one autosave — the debounce already
 * collapses bursts. This bounds the unmetered embedding/chunk-write cost a user can
 * drive by editing content, independently of the chat/generation AI quota.
 *
 * Applies to BYOK users too: indexing uses the platform embedder regardless of a
 * user's own LLM key, so the platform pays for it either way.
 */
export async function consumeIndexingBudget(userId: string): Promise<boolean> {
  return consumeDailyBudget(userId, {
    usageField: "indexUsage",
    dateField: "lastIndexUsageDate",
    limit: getIndexingBudgetLimit(),
  });
}
