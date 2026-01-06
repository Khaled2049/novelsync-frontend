/** Context management utilities for story context operations. */
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

export interface StoryContext {
  story: admin.firestore.DocumentData;
  characters: admin.firestore.DocumentData[];
  places: admin.firestore.DocumentData[];
  plots: admin.firestore.DocumentData[];
  chapters: admin.firestore.DocumentData[];
}

/**
 * Fetch complete story context from Firestore.
 */
export async function getStoryContext(
  db: admin.firestore.Firestore,
  storyId: string
): Promise<StoryContext> {
  const storyRef = db.collection("stories").doc(storyId);
  const storyDoc = await storyRef.get();

  if (!storyDoc.exists) {
    throw new Error(`Story ${storyId} not found`);
  }

  const storyData = storyDoc.data();
  if (!storyData) {
    throw new Error(`Story ${storyId} has no data`);
  }

  // Fetch all subcollections in parallel
  const [chaptersSnapshot, charactersSnapshot, plotsSnapshot, placesSnapshot] =
    await Promise.all([
      storyRef.collection("chapters").get(),
      storyRef.collection("characters").get(),
      storyRef.collection("plots").get(),
      storyRef.collection("places").get(),
    ]);

  const chapters = chaptersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as { chapterNumber?: number; [key: string]: any }),
  }));

  const characters = charactersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const plots = plotsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const places = placesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sort chapters by chapterNumber
  chapters.sort((a, b) => {
    const aNum = a.chapterNumber || 0;
    const bNum = b.chapterNumber || 0;
    return aNum - bNum;
  });

  return {
    story: { id: storyDoc.id, ...storyData },
    characters,
    places,
    plots,
    chapters,
  };
}

/**
 * Update a context element (character, place, or plot) in Firestore.
 */
export async function updateContextElement(
  db: admin.firestore.Firestore,
  storyId: string,
  type: "character" | "place" | "plot",
  elementId: string,
  data: Record<string, unknown>
): Promise<void> {
  const collectionName = `${type}s`; // characters, places, plots
  const elementRef = db
    .collection("stories")
    .doc(storyId)
    .collection(collectionName)
    .doc(elementId);

  await elementRef.set(data, { merge: true });
  logger.info(`Updated ${type} ${elementId} for story ${storyId}`);
}
