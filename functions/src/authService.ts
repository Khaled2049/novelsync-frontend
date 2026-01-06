/** Authentication and authorization utilities. */
import * as admin from "firebase-admin";
import { Request, Response } from "express";
import * as logger from "firebase-functions/logger";

/**
 * Verify Firebase authentication token and get user ID.
 */
export async function verifyAuth(request: Request): Promise<string | null> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    logger.error("Error verifying auth token", error);
    return null;
  }
}

/**
 * Check if user owns the story.
 */
export async function verifyStoryOwnership(
  db: admin.firestore.Firestore,
  storyId: string,
  userId: string
): Promise<boolean> {
  try {
    const storyDoc = await db.collection("stories").doc(storyId).get();

    if (!storyDoc.exists) {
      return false;
    }

    const storyData = storyDoc.data();
    return storyData?.userId === userId;
  } catch (error) {
    logger.error("Error verifying story ownership", error);
    return false;
  }
}

/**
 * Middleware to require authentication.
 */
export function requireAuth(
  handler: (
    request: Request,
    response: Response,
    userId: string
  ) => Promise<void>
) {
  return async (request: Request, response: Response): Promise<void> => {
    const userId = await verifyAuth(request);

    if (!userId) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    await handler(request, response, userId);
  };
}

/**
 * Middleware to require authentication and story ownership.
 */
export function requireStoryOwnership(
  handler: (
    request: Request,
    response: Response,
    userId: string,
    storyId: string
  ) => Promise<void>
) {
  return async (request: Request, response: Response): Promise<void> => {
    const userId = await verifyAuth(request);

    if (!userId) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    const storyId = request.body?.storyId || request.query?.storyId;

    if (!storyId || typeof storyId !== "string") {
      response.status(400).json({ error: "storyId is required" });
      return;
    }

    const db = admin.firestore();
    const ownsStory = await verifyStoryOwnership(db, storyId, userId);

    if (!ownsStory) {
      response
        .status(403)
        .json({ error: "Forbidden: Story not found or access denied" });
      return;
    }

    await handler(request, response, userId, storyId);
  };
}
