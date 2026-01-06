import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  arrayRemove,
  arrayUnion,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { Comment } from "@/types/IComment";

export interface Like {
  userId: string;
  commentId: string;
  createdAt: Date;
}

export class CommentService {
  private storiesCollection = collection(firestore, "stories");

  public getCommentsCollection(storyId: string, chapterId: string) {
    return collection(
      doc(this.storiesCollection, storyId, "chapters", chapterId),
      "comments"
    );
  }

  private getLikesCollection(
    storyId: string,
    chapterId: string,
    commentId: string
  ) {
    return collection(
      doc(
        this.storiesCollection,
        storyId,
        "chapters",
        chapterId,
        "comments",
        commentId
      ),
      "likes"
    );
  }

  async getComment(
    storyId: string,
    chapterId: string,
    commentId: string
  ): Promise<Comment | null> {
    try {
      const commentRef = doc(
        this.getCommentsCollection(storyId, chapterId),
        commentId
      );
      const commentSnap = await getDoc(commentRef);

      if (!commentSnap.exists()) return null;

      const data = commentSnap.data();
      return {
        id: commentSnap.id,
        storyId,
        chapterId,
        message: data.message,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        userId: data.userId,
        username: data.username,
        parentId: data.parentId,
        likes: data.likeCount,
      };
    } catch (error) {
      console.error("Error getting comment:", error);
      throw error;
    }
  }

  async getComments(storyId: string, chapterId: string): Promise<Comment[]> {
    try {
      console.log("storyId", storyId);
      console.log("chapterId", chapterId);
      const commentsCollection = this.getCommentsCollection(storyId, chapterId);
      const q = query(commentsCollection, orderBy("createdAt", "desc"));

      const querySnapshot = await getDocs(q);
      const comments: Comment[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          storyId,
          chapterId,
          message: data.message,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          userId: data.userId,
          username: data.username,
          parentId: data.parentId,
          likes: data.likeCount,
        });
      });

      return comments;
    } catch (error) {
      console.error("Error getting comments:", error);
      throw error;
    }
  }

  async getReplies(
    storyId: string,
    chapterId: string,
    parentId: string
  ): Promise<Comment[]> {
    try {
      const commentsCollection = this.getCommentsCollection(storyId, chapterId);
      const q = query(
        commentsCollection,
        where("parentId", "==", parentId),
        orderBy("createdAt", "asc")
      );

      const querySnapshot = await getDocs(q);
      const replies: Comment[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        replies.push({
          id: doc.id,
          storyId,
          chapterId,
          message: data.message,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          userId: data.userId,
          username: data.username,
          parentId: data.parentId,
          likes: data.likeCount,
        });
      });

      return replies;
    } catch (error) {
      console.error("Error getting replies:", error);
      throw error;
    }
  }

  async addComment(
    storyId: string,
    chapterId: string,
    userId: string,
    username: string,
    message: string,
    parentId: string | null = null
  ): Promise<string> {
    try {
      const commentsCollection = this.getCommentsCollection(storyId, chapterId);
      const newCommentRef = doc(commentsCollection);

      const newComment = {
        id: newCommentRef.id,
        message,
        userId,
        username,
        parentId,
        likes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(newCommentRef, newComment);
      return newComment.id;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  async updateComment(
    storyId: string,
    chapterId: string,
    commentId: string,
    message: string
  ): Promise<void> {
    try {
      const commentRef = doc(
        this.getCommentsCollection(storyId, chapterId),
        commentId
      );

      await updateDoc(commentRef, {
        message,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
  }

  async deleteComment(
    storyId: string,
    chapterId: string,
    commentId: string
  ): Promise<void> {
    try {
      const commentsCollection = this.getCommentsCollection(storyId, chapterId);
      const batch = writeBatch(firestore);

      // First delete all nested replies in a single query
      const repliesQuery = query(
        commentsCollection,
        where("parentId", "==", commentId)
      );
      const repliesSnapshot = await getDocs(repliesQuery);

      // Add all replies to batch
      repliesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete comment itself
      const commentRef = doc(commentsCollection, commentId);
      batch.delete(commentRef);

      // Execute all deletions in single batch
      await batch.commit();

      // Delete likes subcollection (if using separate collection)
      await this._deleteLikesCollection(storyId, chapterId, commentId);
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }

  private async _deleteLikesCollection(
    storyId: string,
    chapterId: string,
    commentId: string
  ): Promise<void> {
    const likesCollection = this.getLikesCollection(
      storyId,
      chapterId,
      commentId
    );
    const likesSnapshot = await getDocs(likesCollection);
    const batch = writeBatch(firestore);

    likesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
  async addLike(
    storyId: string,
    chapterId: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    try {
      const likesCollection = this.getLikesCollection(
        storyId,
        chapterId,
        commentId
      );
      const likeRef = doc(likesCollection);

      // Check if user already liked
      const q = query(likesCollection, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error("User already liked this comment");
      }

      const newLike: Like = {
        userId,
        commentId,
        createdAt: new Date(),
      };

      await setDoc(likeRef, newLike);

      // Increment the comment's like count
      const commentRef = doc(
        this.getCommentsCollection(storyId, chapterId),
        commentId
      );
      await updateDoc(commentRef, {
        likeCount: increment(1),
      });
    } catch (error) {
      console.error("Error adding like:", error);
      throw error;
    }
  }
  async toggleLike(
    storyId: string,
    chapterId: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    const commentRef = doc(
      this.getCommentsCollection(storyId, chapterId),
      commentId
    );

    try {
      await runTransaction(firestore, async (transaction) => {
        const commentSnap = await transaction.get(commentRef);
        if (!commentSnap.exists()) {
          throw new Error("Comment not found");
        }

        const data = commentSnap.data();
        const likes = data.likes || [];

        // Update with the appropriate array operation based on current state
        transaction.update(commentRef, {
          likes: likes.includes(userId)
            ? arrayRemove(userId)
            : arrayUnion(userId),
        });
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  }

  async removeLike(
    storyId: string,
    chapterId: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    try {
      const likesCollection = this.getLikesCollection(
        storyId,
        chapterId,
        commentId
      );
      const q = query(likesCollection, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Like not found");
      }

      // Delete the like document
      await deleteDoc(querySnapshot.docs[0].ref);

      // Decrement the comment's like count
      const commentRef = doc(
        this.getCommentsCollection(storyId, chapterId),
        commentId
      );
      await updateDoc(commentRef, {
        likeCount: increment(-1),
      });
    } catch (error) {
      console.error("Error removing like:", error);
      throw error;
    }
  }

  async hasUserLiked(
    storyId: string,
    chapterId: string,
    commentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const likesCollection = this.getLikesCollection(
        storyId,
        chapterId,
        commentId
      );
      const q = query(likesCollection, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking if user liked:", error);
      throw error;
    }
  }

  async getLikeCount(
    storyId: string,
    chapterId: string,
    commentId: string
  ): Promise<number> {
    try {
      const commentRef = doc(
        this.getCommentsCollection(storyId, chapterId),
        commentId
      );
      const commentSnap = await getDoc(commentRef);

      if (!commentSnap.exists()) {
        throw new Error("Comment not found");
      }

      return commentSnap.data().likeCount;
    } catch (error) {
      console.error("Error getting like count:", error);
      throw error;
    }
  }
}
