/** Chapter continuity context for generation. */
import * as admin from "firebase-admin";

/**
 * Max neighbor body chars sent to the agent. The agent only consumes a bounded
 * slice for continuity, so truncating here (instead of shipping the full 5000-
 * word body) cuts payload/prompt size with no loss. Keep in sync with the
 * agent's neighbor slice.
 */
const NEIGHBOR_CONTENT_CHARS = 2500;

/** Neighbor chapter (immediately before/after target order), body truncated. */
export interface NeighborChapter {
  chapterNumber?: number;
  order?: number;
  title?: string;
  content?: string;
}

export interface ChapterContinuityContext {
  prevChapter: NeighborChapter | null;
  nextChapter: NeighborChapter | null;
}

/**
 * Build bounded continuity context for chapter generation.
 *
 * Returns only the FULL (truncated) text of the immediate neighbors around
 * `targetOrder` — the previous chapter (how the story just left off) and, for
 * mid-story inserts, the next chapter (what this one must lead into). We do NOT
 * load every chapter's summary: that list was hollow for hand-written stories
 * (no summaries) and cost an extra all-chapters Firestore read. Neighbor text is
 * the continuity signal that actually matters, so the prompt stays small and the
 * payload no longer grows with story length.
 *
 * `targetOrder` is the float `order` of the chapter being (re)generated. A chapter
 * inserted between two others bridges both `prevChapter` and `nextChapter`.
 */
export async function getChapterContinuityContext(
  db: admin.firestore.Firestore,
  storyId: string,
  targetOrder: number
): Promise<ChapterContinuityContext> {
  const chaptersRef = db
    .collection("stories")
    .doc(storyId)
    .collection("chapters");

  const [prevSnap, nextSnap] = await Promise.all([
    chaptersRef
      .where("order", "<", targetOrder)
      .orderBy("order", "desc")
      .limit(1)
      .get(),
    chaptersRef
      .where("order", ">", targetOrder)
      .orderBy("order", "asc")
      .limit(1)
      .get(),
  ]);

  const toNeighbor = (
    snap: admin.firestore.QuerySnapshot
  ): NeighborChapter | null => {
    if (snap.empty) return null;
    const d = snap.docs[0].data();
    const content =
      typeof d.content === "string"
        ? d.content.slice(0, NEIGHBOR_CONTENT_CHARS)
        : d.content;
    return {
      chapterNumber: d.chapterNumber,
      order: d.order,
      title: d.title,
      content,
    };
  };

  return {
    prevChapter: toNeighbor(prevSnap),
    nextChapter: toNeighbor(nextSnap),
  };
}
