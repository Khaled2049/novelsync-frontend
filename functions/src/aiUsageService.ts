/** AI Usage tracking and validation utilities. */
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

/**
 * Get current UTC date string (YYYY-MM-DD format).
 */
function getCurrentUtcDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Check and increment AI usage for a user.
 * Returns true if usage is allowed, false if limit exceeded.
 * Also increments the usage counter if allowed.
 */
export async function checkAndIncrementAiUsage(
  userId: string
): Promise<{ allowed: boolean; currentUsage: number; remaining: number }> {
  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      logger.warn(`User document not found: ${userId}`);
      // Create user document with default values
      const currentDate = getCurrentUtcDate();
      await userDocRef.set(
        {
          aiUsage: 1,
          lastAiUsageDate: currentDate,
        },
        { merge: true }
      );
      console.log("userDoc", userDoc.data());
      return { allowed: true, currentUsage: 1, remaining: 9 };
    }

    const userData = userDoc.data();
    const currentDate = getCurrentUtcDate();
    const lastUsageDate = userData?.lastAiUsageDate || currentDate;
    let currentUsage = userData?.aiUsage || 0;

    // If it's a new day, reset the usage counter
    if (currentDate !== lastUsageDate) {
      currentUsage = 0;
    }

    // Check if limit exceeded
    if (currentUsage >= 10) {
      return { allowed: false, currentUsage, remaining: 0 };
    }

    // Increment usage
    currentUsage += 1;

    // Update Firestore
    await userDocRef.update({
      aiUsage: currentUsage,
      lastAiUsageDate: currentDate,
    });

    const remaining = 10 - currentUsage;
    return { allowed: true, currentUsage, remaining };
  } catch (error) {
    logger.error("Error checking/incrementing AI usage", error);
    // On error, allow the request but log it
    return { allowed: true, currentUsage: 0, remaining: 10 };
  }
}
