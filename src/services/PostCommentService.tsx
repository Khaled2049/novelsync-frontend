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
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { IPostComment } from "@/types/IPostComment";
import { voteService } from "./VoteService";
import { rateLimitService } from "./RateLimitService";

class PostCommentService {
  private postsCollection = collection(firestore, "posts");

  private getCommentsCollection(postId: string) {
    return collection(doc(this.postsCollection, postId), "comments");
  }

  async getComments(postId: string): Promise<IPostComment[]> {
    try {
      const commentsCollection = this.getCommentsCollection(postId);
      const q = query(commentsCollection, orderBy("createdAt", "desc"));

      const querySnapshot = await getDocs(q);
      const comments: IPostComment[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          postId,
          content: data.content,
          authorId: data.authorId,
          authorName: data.authorName,
          parentId: data.parentId || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          upvoteCount: data.upvoteCount || 0,
          downvoteCount: data.downvoteCount || 0,
        });
      });

      return comments;
    } catch (error) {
      console.error("Error getting comments:", error);
      throw error;
    }
  }

  async getReplies(postId: string, parentId: string): Promise<IPostComment[]> {
    try {
      const commentsCollection = this.getCommentsCollection(postId);
      const q = query(
        commentsCollection,
        where("parentId", "==", parentId),
        orderBy("createdAt", "asc"),
      );

      const querySnapshot = await getDocs(q);
      const replies: IPostComment[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        replies.push({
          id: doc.id,
          postId,
          content: data.content,
          authorId: data.authorId,
          authorName: data.authorName,
          parentId: data.parentId || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          upvoteCount: data.upvoteCount || 0,
          downvoteCount: data.downvoteCount || 0,
        });
      });

      return replies;
    } catch (error) {
      console.error("Error getting replies:", error);
      throw error;
    }
  }

  async addComment(
    postId: string,
    comment: Omit<IPostComment, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      // Check rate limit before creating comment
      const rateLimitCheck = await rateLimitService.canCreateComment(
        comment.authorId,
      );
      if (!rateLimitCheck.allowed) {
        const error = new Error(
          rateLimitCheck.message || "Rate limit exceeded",
        );
        (error as any).code = "RATE_LIMIT_EXCEEDED";
        (error as any).count = rateLimitCheck.count;
        (error as any).limit = rateLimitCheck.limit;
        throw error;
      }

      const commentsCollection = this.getCommentsCollection(postId);
      const newCommentRef = doc(commentsCollection);

      const newComment = {
        ...comment,
        id: newCommentRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvoteCount: 0,
        downvoteCount: 0,
      };

      await setDoc(newCommentRef, newComment);

      // Increment comment count on post
      const postRef = doc(this.postsCollection, postId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const currentCount = postDoc.data().commentCount || 0;
        await updateDoc(postRef, {
          commentCount: currentCount + 1,
        });
      }

      // Increment comment count for rate limiting
      await rateLimitService.incrementCommentCount(comment.authorId);

      return newCommentRef.id;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  async updateComment(
    postId: string,
    commentId: string,
    content: string,
  ): Promise<void> {
    try {
      const commentRef = doc(this.getCommentsCollection(postId), commentId);
      await updateDoc(commentRef, {
        content,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
  }

  async deleteComment(postId: string, commentId: string): Promise<void> {
    try {
      const commentsCollection = this.getCommentsCollection(postId);
      const batch = writeBatch(firestore);

      // First delete all nested replies
      const repliesQuery = query(
        commentsCollection,
        where("parentId", "==", commentId),
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

      // Decrement comment count on post
      const postRef = doc(this.postsCollection, postId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const currentCount = postDoc.data().commentCount || 0;
        const deletedCount = repliesSnapshot.size + 1; // replies + parent comment
        await updateDoc(postRef, {
          commentCount: Math.max(0, currentCount - deletedCount),
        });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }

  async getCommentsWithUserVotes(
    postId: string,
    commentIds: string[],
    userId: string,
  ): Promise<IPostComment[]> {
    try {
      // Fetch comments
      const commentsCollection = this.getCommentsCollection(postId);
      const comments: IPostComment[] = [];

      for (const commentId of commentIds) {
        const commentDoc = await getDoc(doc(commentsCollection, commentId));
        if (commentDoc.exists()) {
          const data = commentDoc.data();
          comments.push({
            id: commentDoc.id,
            postId,
            content: data.content,
            authorId: data.authorId,
            authorName: data.authorName,
            parentId: data.parentId || null,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            upvoteCount: data.upvoteCount || 0,
            downvoteCount: data.downvoteCount || 0,
          });
        }
      }

      // Fetch user votes and merge
      const userVotes = await voteService.getUserVotesForComments(
        postId,
        commentIds,
        userId,
      );
      return comments.map((comment) => ({
        ...comment,
        userVote: userVotes.get(comment.id) || null,
      }));
    } catch (error) {
      console.error("Error getting comments with user votes:", error);
      throw error;
    }
  }
}

export const postCommentService = new PostCommentService();
