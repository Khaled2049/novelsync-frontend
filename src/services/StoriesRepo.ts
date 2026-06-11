import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  increment,
  where,
  writeBatch,
  serverTimestamp,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { auth, firestore } from "../config/firebase";
import { Chapter, Story, StoryMetadata } from "@/types/IStory";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../config/firebase";
import { storageService } from "./StorageService";

const WORD_LIMIT = 5000;
const CHAPTER_LIMIT = 50;

export const STORIES_PAGE_SIZE = 24;

/** Cursor for paginated published-story queries (the last doc of the prior page). */
export type StoryCursor = QueryDocumentSnapshot<DocumentData> | null;

export interface PublishedStoriesPage {
  stories: StoryMetadata[];
  /** Cursor to fetch the next page, or null when there are no more pages. */
  cursor: StoryCursor;
}

class StoriesRepo {
  private storiesCollection = collection(firestore, "stories");

  /** Maps a Firestore story doc to the StoryMetadata shape used by lists. */
  private mapStoryDoc(doc: QueryDocumentSnapshot<DocumentData>): StoryMetadata {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      chapterCount: data.chapterCount,
      isPublished: data.isPublished,
      updatedAt: data.updatedAt.toDate(),
      createdAt: data.createdAt.toDate(),
      author: data.author,
      views: data.views,
      likes: data.likes,
      coverImageUrl: data.coverImageUrl || "",
      tags: data.tags || [],
      category: data.category || undefined,
    };
  }

  private getStoryLikesCollection(storyId: string) {
    return collection(doc(this.storiesCollection, storyId), "likes");
  }

  private getStoryRatingsCollection(storyId: string) {
    return collection(doc(this.storiesCollection, storyId), "ratings");
  }

  async getStoryList(): Promise<StoryMetadata[]> {
    const q = query(this.storiesCollection, orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        chapterCount: data.chapterCount,
        isPublished: data.isPublished,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        author: data.author,
        views: data.views,
        likes: data.likes,
        coverImageUrl: data.coverImageUrl || "",
      };
    });
  }

  async getPublishedStories(
    cursor: StoryCursor = null,
    pageSize = STORIES_PAGE_SIZE,
  ): Promise<PublishedStoriesPage> {
    const q = query(
      this.storiesCollection,
      where("isPublished", "==", true),
      orderBy("updatedAt", "desc"),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(pageSize),
    );
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    return {
      stories: docs.map((doc) => this.mapStoryDoc(doc)),
      // A full page implies there may be more; a short page is the last one.
      cursor: docs.length === pageSize ? docs[docs.length - 1] : null,
    };
  }

  async getPublishedStoriesByCategory(
    category: string,
    cursor: StoryCursor = null,
    pageSize = STORIES_PAGE_SIZE,
  ): Promise<PublishedStoriesPage> {
    try {
      const q = query(
        this.storiesCollection,
        where("isPublished", "==", true),
        where("category", "==", category),
        orderBy("updatedAt", "desc"),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(pageSize),
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;
      return {
        stories: docs.map((doc) => this.mapStoryDoc(doc)),
        cursor: docs.length === pageSize ? docs[docs.length - 1] : null,
      };
    } catch (error: any) {
      // Handle Firestore index errors gracefully
      if (error?.code === "failed-precondition") {
        console.error(
          "Firestore index required. Please create a composite index for: isPublished, category, updatedAt",
          error,
        );
        // Return empty page if index is missing - user will need to create the index
        return { stories: [], cursor: null };
      }
      console.error("Error fetching stories by category:", error);
      throw error;
    }
  }

  async fetchNovelCoverUrls(novels: string[]): Promise<string[]> {
    const novelCoverURLs: string[] = [];
    for (let novel of novels) {
      const storageRef = ref(storage, `book-covers/${novel}`);
      const novelCoverURL = await getDownloadURL(storageRef);
      novelCoverURLs.push(novelCoverURL);
    }
    return novelCoverURLs;
  }

  async getUserStories(userId: string): Promise<StoryMetadata[]> {
    const q = query(
      this.storiesCollection,
      orderBy("updatedAt", "desc"),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        chapterCount: data.chapterCount,
        isPublished: data.isPublished,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt.toDate(),
        author: data.author,
        views: data.views,
        likes: data.likes,
        coverImageUrl: data.coverImageUrl || "",
        tags: data.tags || [],
        category: data.category || "",
        targetAudience: data.targetAudience || "",
        language: data.language || "",
        copyright: data.copyright || "",
      };
    });
  }

  async getStory(storyId: string): Promise<Story | null> {
    try {
      const storyRef = doc(this.storiesCollection, storyId);
      const storySnap = await getDoc(storyRef);
      if (storySnap.exists()) {
        const data = storySnap.data();
        return {
          id: storySnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          coverImageUrl: data.coverImageUrl || "",
          tags: data.tags || [],
          averageRating: data.averageRating ?? undefined,
          ratingsCount: data.ratingsCount ?? undefined,
        } as Story;
      }
    } catch (error) {
      console.error("Error getting story:", error);
    }
    return null;
  }

  async getUserInfo(userId: string): Promise<string> {
    try {
      const publicProfileRef = doc(firestore, "publicProfiles", userId);
      const profileSnap = await getDoc(publicProfileRef);
      if (profileSnap.exists()) {
        const profile = profileSnap.data();
        return profile.username || profile.displayName || "";
      }
    } catch (error) {
      console.error("Error getting user info:", error);
    }
    return "";
  }

  async incrementViewCount(storyId: string): Promise<void> {
    const storyRef = doc(firestore, "stories", storyId);

    try {
      await updateDoc(storyRef, {
        views: increment(1),
      });
    } catch (error) {
      console.error("Error incrementing views: ", error);
    }
  }

  async incrementLikeCount(storyId: string): Promise<void> {
    const storyRef = doc(firestore, "stories", storyId);

    try {
      // Get the current document to check the like count
      const storySnapshot = await getDoc(storyRef);

      if (storySnapshot.exists()) {
        const storyData = storySnapshot.data();
        const currentLikes = storyData.likes || 0;

        // Only increment if likes are less than 5
        if (currentLikes < 5) {
          await updateDoc(storyRef, {
            likes: increment(1),
          });
        } else {
          console.log(
            "We get it you really like this story. No more likes allowed.",
          );
        }
      }
    } catch (error) {
      console.error("Error incrementing likes: ", error);
    }
  }

  async toggleStoryLike(storyId: string, userId: string): Promise<boolean> {
    try {
      const likesCollection = this.getStoryLikesCollection(storyId);
      const likeRef = doc(likesCollection, userId);
      const storyRef = doc(this.storiesCollection, storyId);
      const batch = writeBatch(firestore);

      // Get current like if exists
      const currentLikeDoc = await getDoc(likeRef);
      const hasLiked = currentLikeDoc.exists();

      if (hasLiked) {
        // Remove like
        batch.delete(likeRef);
        batch.update(storyRef, {
          likes: increment(-1),
        });
      } else {
        // Add like
        batch.set(likeRef, {
          userId,
          timestamp: serverTimestamp(),
        });
        batch.update(storyRef, {
          likes: increment(1),
        });
      }

      await batch.commit();
      return !hasLiked; // Return true if we added a like, false if we removed it
    } catch (error) {
      console.error("Error toggling story like:", error);
      throw error;
    }
  }

  async hasUserLikedStory(storyId: string, userId: string): Promise<boolean> {
    try {
      const likesCollection = this.getStoryLikesCollection(storyId);
      const likeRef = doc(likesCollection, userId);
      const likeDoc = await getDoc(likeRef);
      return likeDoc.exists();
    } catch (error) {
      console.error("Error checking if user liked story:", error);
      return false;
    }
  }

  async getUserRating(storyId: string, userId: string): Promise<number | null> {
    try {
      const ratingsCollection = this.getStoryRatingsCollection(storyId);
      const ratingRef = doc(ratingsCollection, userId);
      const ratingDoc = await getDoc(ratingRef);
      if (ratingDoc.exists()) {
        return ratingDoc.data().rating as number;
      }
      return null;
    } catch (error) {
      console.error("Error getting user rating:", error);
      return null;
    }
  }

  async getStoryRatingStats(
    storyId: string,
  ): Promise<{ averageRating: number; ratingsCount: number }> {
    try {
      const ratingsCollection = this.getStoryRatingsCollection(storyId);
      const ratingsSnapshot = await getDocs(ratingsCollection);

      if (ratingsSnapshot.empty) {
        return { averageRating: 0, ratingsCount: 0 };
      }

      let totalRating = 0;
      let count = 0;
      ratingsSnapshot.docs.forEach((doc) => {
        const rating = doc.data().rating;
        if (typeof rating === "number" && rating >= 1 && rating <= 5) {
          totalRating += rating;
          count++;
        }
      });

      const averageRating = count > 0 ? totalRating / count : 0;
      return {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        ratingsCount: count,
      };
    } catch (error) {
      console.error("Error getting story rating stats:", error);
      return { averageRating: 0, ratingsCount: 0 };
    }
  }

  async submitStoryRating(
    storyId: string,
    userId: string,
    rating: number,
  ): Promise<void> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      const ratingsCollection = this.getStoryRatingsCollection(storyId);
      const ratingRef = doc(ratingsCollection, userId);
      const storyRef = doc(this.storiesCollection, storyId);

      // Check if user already rated
      const existingRatingDoc = await getDoc(ratingRef);
      if (existingRatingDoc.exists()) {
        throw new Error("User has already rated this story");
      }

      // Create rating document
      await setDoc(ratingRef, {
        userId,
        rating,
        timestamp: serverTimestamp(),
      });

      // Recalculate average rating and count
      const stats = await this.getStoryRatingStats(storyId);

      // Update story document with new rating stats
      await updateDoc(storyRef, {
        averageRating: stats.averageRating,
        ratingsCount: stats.ratingsCount,
      });
    } catch (error) {
      console.error("Error submitting story rating:", error);
      throw error;
    }
  }

  async createStory(
    title: string,
    description: string,
    userId: string,
    metadata: {
      category: string;
      tags: string[];
      targetAudience: string;
      language: string;
      copyright: string;
      coverImageUrl: string;
    },
  ): Promise<string> {
    const newStoryRef = doc(this.storiesCollection);
    const author = await this.getUserInfo(userId);
    const newStory: Story = {
      id: newStoryRef.id,
      title,
      description,
      userId,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      chapterCount: 0,
      author,
      views: 0,
      likes: 0,
      ...metadata,
    };
    await setDoc(newStoryRef, newStory);
    try {
      await this.addChapter(newStoryRef.id, "Chapter 1");
    } catch (error) {
      console.error("Error adding first chapter:", error);
      throw error;
    }
    return newStoryRef.id;
  }

  async deleteStory(storyId: string): Promise<void> {
    const storyRef = doc(this.storiesCollection, storyId);
    await deleteDoc(storyRef);
  }

  async updateStory(
    storyId: string,
    title: string,
    description: string,
  ): Promise<void> {
    try {
      const storyRef = doc(this.storiesCollection, storyId);
      await updateDoc(storyRef, {
        title,
        description,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating story:", error);
      throw error;
    }
  }

  async updateStoryMetadata(
    storyId: string,
    data: {
      title: string;
      description: string;
      category?: string;
      tags?: string[];
      targetAudience?: string;
      language?: string;
      copyright?: string;
    },
  ): Promise<void> {
    const storyRef = doc(this.storiesCollection, storyId);
    // Firestore rejects `undefined` field values — drop any undefined keys so
    // callers can safely omit optional fields.
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
    await updateDoc(storyRef, { ...cleaned, updatedAt: new Date() });
  }

  async addChapter(storyId: string, chapterTitle: string): Promise<string> {
    try {
      const storyRef = doc(this.storiesCollection, storyId);
      const chaptersCollection = collection(storyRef, "chapters");

      const story = await this.getStory(storyId);
      if (!story) throw new Error("Story not found");

      if (story.chapterCount >= CHAPTER_LIMIT) {
        throw new Error(
          `Chapter limit reached. Current chapter count: ${story.chapterCount}`,
        );
      }

      const newChapterRef = doc(chaptersCollection);
      const newChapter: Chapter = {
        id: newChapterRef.id,
        title: chapterTitle,
        content: "",
        order: story.chapterCount,
        wordCount: 0,
        userId: story.userId,
      };

      await setDoc(newChapterRef, newChapter);

      // Update the story's chapter count
      await updateDoc(storyRef, {
        chapterCount: story.chapterCount + 1,
        updatedAt: new Date(),
      });

      return newChapter.id;
    } catch (error) {
      console.error("Error adding chapter:", error);
      throw error;
    }
  }

  async getChapters(storyId: string): Promise<Chapter[]> {
    try {
      const chaptersCollection = collection(
        doc(this.storiesCollection, storyId),
        "chapters",
      );
      const q = query(chaptersCollection, orderBy("order"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Chapter,
      );
    } catch (error) {
      console.error("Error getting chapters:", error);
    }
    return [];
  }

  async getChapterMetaList(
    storyId: string,
  ): Promise<Omit<Chapter, "content">[]> {
    try {
      const chaptersCollection = collection(
        doc(this.storiesCollection, storyId),
        "chapters",
      );
      const q = query(chaptersCollection, orderBy("order"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => {
        const data = d.data() as Chapter;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { content: _content, ...rest } = data;
        return { ...rest, id: d.id };
      });
    } catch (error) {
      console.error("Error getting chapter metadata:", error);
    }
    return [];
  }

  async getChapter(
    storyId: string,
    chapterId: string,
  ): Promise<Chapter | null> {
    const chapterRef = doc(
      this.storiesCollection,
      storyId,
      "chapters",
      chapterId,
    );
    const chapterSnap = await getDoc(chapterRef);
    if (chapterSnap.exists()) {
      return { id: chapterSnap.id, ...chapterSnap.data() } as Chapter;
    }
    return null;
  }

  async updateChapter(
    storyId: string,
    chapterId: string,
    title: string,
    content: string,
  ): Promise<void> {
    try {
      const chapterRef = doc(
        this.storiesCollection,
        storyId,
        "chapters",
        chapterId,
      );
      const wordCount = this.countWords(content);
      if (wordCount > WORD_LIMIT) {
        throw new Error(
          `Chapter exceeds ${WORD_LIMIT} word limit. Current word count: ${wordCount}`,
        );
      }

      await updateDoc(chapterRef, {
        title,
        content,
        wordCount,
      });

      // Update the story's updatedAt field
      await updateDoc(doc(this.storiesCollection, storyId), {
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating chapter:", error);
      throw error;
    }
  }

  async deleteChapter(storyId: string, chapterId: string): Promise<void> {
    const chapterRef = doc(
      this.storiesCollection,
      storyId,
      "chapters",
      chapterId,
    );
    await deleteDoc(chapterRef);

    // Update the story's chapter count and updatedAt field
    const storyRef = doc(this.storiesCollection, storyId);
    const story = await this.getStory(storyId);
    if (story) {
      await updateDoc(storyRef, {
        chapterCount: story.chapterCount - 1,
        updatedAt: new Date(),
      });
    }
  }

  async handlePublish(storyId: string): Promise<void> {
    try {
      const storyRef = doc(this.storiesCollection, storyId);

      const story = await this.getStory(storyId);
      if (!story) {
        throw new Error("Story not found");
      }

      await updateDoc(storyRef, {
        isPublished: !story.isPublished,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error(`Failed to update story ${storyId}:`, error);
      throw error; // Re-throw if you need to propagate the error
    }
  }

  async updateStoryCoverImage(
    storyId: string,
    imageFile: File | null,
    previewUrl: string | null,
  ): Promise<void> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error("You must be signed in to update the cover image.");
      }

      const storyRef = doc(this.storiesCollection, storyId);
      const story = await this.getStory(storyId);
      if (!story) throw new Error("Story not found");
      if (story.userId !== uid) {
        throw new Error("You do not have permission to update this cover.");
      }

      // Delete the old image from Storage before replacing it
      if (story.coverImageUrl) {
        await storageService.deleteCoverImage(story.coverImageUrl);
      }

      let coverImageUrl = "";

      if (imageFile) {
        // User-selected file or AI-generated File object
        coverImageUrl = await storageService.uploadCoverImage(
          imageFile,
          uid,
          storyId,
        );
      } else if (previewUrl?.startsWith("data:")) {
        // AI-generated data URL — convert to File before uploading
        const file = storageService.dataUrlToFile(previewUrl);
        coverImageUrl = await storageService.uploadCoverImage(
          file,
          uid,
          storyId,
        );
      }

      await updateDoc(storyRef, { coverImageUrl, updatedAt: new Date() });
    } catch (error) {
      console.error("Error updating cover image:", error);
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "storage/unauthorized"
      ) {
        throw new Error(
          "Cover upload was denied. Use a JPEG, PNG, or WebP under 2 MB, then try again. If this persists, storage rules may need redeploying (`firebase deploy --only storage`).",
        );
      }
      throw error;
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  getWordLimit(): number {
    return WORD_LIMIT;
  }
}

export const storiesRepo = new StoriesRepo();
