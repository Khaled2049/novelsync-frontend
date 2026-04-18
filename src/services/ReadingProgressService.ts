import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { IReadingProgress } from "@/types/IReadingProgress";

class ReadingProgressService {
  private getProgressCollection(userId: string) {
    return collection(firestore, "users", userId, "readingProgress");
  }

  async saveProgress(
    userId: string,
    data: {
      storyId: string;
      chapterIndex: number;
      storyTitle: string;
      storyAuthor: string;
      coverImageUrl: string;
      totalChapters: number;
    },
  ): Promise<void> {
    try {
      const progressRef = doc(this.getProgressCollection(userId), data.storyId);
      await setDoc(
        progressRef,
        {
          storyId: data.storyId,
          chapterIndex: data.chapterIndex,
          lastReadAt: serverTimestamp(),
          storyTitle: data.storyTitle,
          storyAuthor: data.storyAuthor,
          coverImageUrl: data.coverImageUrl,
          totalChapters: data.totalChapters,
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Error saving reading progress:", error);
      // Non-throwing: a failed save should never interrupt the reading experience
    }
  }

  async getProgress(userId: string, storyId: string): Promise<number> {
    try {
      const progressRef = doc(this.getProgressCollection(userId), storyId);
      const snap = await getDoc(progressRef);
      if (snap.exists()) {
        return (snap.data().chapterIndex as number) ?? 0;
      }
    } catch (error) {
      console.error("Error fetching reading progress:", error);
    }
    return 0;
  }

  async getRecentlyRead(
    userId: string,
    resultLimit: number = 5,
  ): Promise<IReadingProgress[]> {
    try {
      const q = query(
        this.getProgressCollection(userId),
        orderBy("lastReadAt", "desc"),
        limit(resultLimit),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          storyId: data.storyId,
          chapterIndex: data.chapterIndex,
          lastReadAt: data.lastReadAt?.toDate() ?? new Date(),
          storyTitle: data.storyTitle,
          storyAuthor: data.storyAuthor,
          coverImageUrl: data.coverImageUrl ?? "",
          totalChapters: data.totalChapters,
        } as IReadingProgress;
      });
    } catch (error) {
      console.error("Error fetching recently read stories:", error);
      return [];
    }
  }
  async clearAllProgress(userId: string): Promise<void> {
    try {
      const snap = await getDocs(this.getProgressCollection(userId));
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    } catch (error) {
      console.error("Error clearing reading progress:", error);
    }
  }
}

export const readingProgressService = new ReadingProgressService();
