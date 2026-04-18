import {
  collection,
  doc,
  getDoc,
  increment,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";

class VoteService {
  private postsCollection = collection(firestore, "posts");

  private getPostVotesCollection(postId: string) {
    return collection(doc(this.postsCollection, postId), "votes");
  }

  private getCommentVotesCollection(postId: string, commentId: string) {
    const commentsCollection = collection(
      doc(this.postsCollection, postId),
      "comments",
    );
    return collection(doc(commentsCollection, commentId), "votes");
  }

  async getUserVote(
    postId: string,
    userId: string,
    type: "post" | "comment",
    commentId?: string,
  ): Promise<"up" | "down" | null> {
    try {
      const votesCollection =
        type === "post"
          ? this.getPostVotesCollection(postId)
          : this.getCommentVotesCollection(postId, commentId!);

      const voteDoc = await getDoc(doc(votesCollection, userId));
      if (!voteDoc.exists()) {
        return null;
      }

      const voteData = voteDoc.data();
      return voteData.voteType as "up" | "down";
    } catch (error) {
      console.error("Error getting user vote:", error);
      return null;
    }
  }

  async votePost(
    postId: string,
    userId: string,
    voteType: "up" | "down" | null,
  ): Promise<void> {
    try {
      const votesCollection = this.getPostVotesCollection(postId);
      const voteRef = doc(votesCollection, userId);
      const postRef = doc(this.postsCollection, postId);
      const batch = writeBatch(firestore);

      // Get current vote if exists
      const currentVoteDoc = await getDoc(voteRef);
      const currentVote = currentVoteDoc.exists()
        ? (currentVoteDoc.data().voteType as "up" | "down")
        : null;

      if (voteType === null) {
        // Remove vote
        if (currentVoteDoc.exists()) {
          batch.delete(voteRef);
          // Decrement the appropriate count
          if (currentVote === "up") {
            batch.update(postRef, {
              upvoteCount: increment(-1),
            });
          } else if (currentVote === "down") {
            batch.update(postRef, {
              downvoteCount: increment(-1),
            });
          }
        }
      } else {
        // Add or update vote
        if (currentVote === null) {
          // New vote
          batch.set(voteRef, {
            userId,
            voteType,
            timestamp: serverTimestamp(),
          });
          // Increment the appropriate count
          if (voteType === "up") {
            batch.update(postRef, {
              upvoteCount: increment(1),
            });
          } else {
            batch.update(postRef, {
              downvoteCount: increment(1),
            });
          }
        } else if (currentVote === voteType) {
          // Toggle: clicking same button removes vote
          batch.delete(voteRef);
          // Decrement the count
          if (voteType === "up") {
            batch.update(postRef, {
              upvoteCount: increment(-1),
            });
          } else {
            batch.update(postRef, {
              downvoteCount: increment(-1),
            });
          }
        } else {
          // Changing vote (up to down or down to up)
          batch.update(voteRef, {
            voteType,
            timestamp: serverTimestamp(),
          });
          // Decrement old count, increment new count
          if (currentVote === "up") {
            batch.update(postRef, {
              upvoteCount: increment(-1),
              downvoteCount: increment(1),
            });
          } else {
            batch.update(postRef, {
              upvoteCount: increment(1),
              downvoteCount: increment(-1),
            });
          }
        }
      }

      await batch.commit();
    } catch (error) {
      console.error("Error voting on post:", error);
      throw error;
    }
  }

  async voteComment(
    postId: string,
    commentId: string,
    userId: string,
    voteType: "up" | "down" | null,
  ): Promise<void> {
    try {
      const votesCollection = this.getCommentVotesCollection(postId, commentId);
      const voteRef = doc(votesCollection, userId);
      const commentsCollection = collection(
        doc(this.postsCollection, postId),
        "comments",
      );
      const commentRef = doc(commentsCollection, commentId);
      const batch = writeBatch(firestore);

      // Get current vote if exists
      const currentVoteDoc = await getDoc(voteRef);
      const currentVote = currentVoteDoc.exists()
        ? (currentVoteDoc.data().voteType as "up" | "down")
        : null;

      if (voteType === null) {
        // Remove vote
        if (currentVoteDoc.exists()) {
          batch.delete(voteRef);
          // Decrement the appropriate count
          if (currentVote === "up") {
            batch.update(commentRef, {
              upvoteCount: increment(-1),
            });
          } else if (currentVote === "down") {
            batch.update(commentRef, {
              downvoteCount: increment(-1),
            });
          }
        }
      } else {
        // Add or update vote
        if (currentVote === null) {
          // New vote
          batch.set(voteRef, {
            userId,
            voteType,
            timestamp: serverTimestamp(),
          });
          // Increment the appropriate count
          if (voteType === "up") {
            batch.update(commentRef, {
              upvoteCount: increment(1),
            });
          } else {
            batch.update(commentRef, {
              downvoteCount: increment(1),
            });
          }
        } else if (currentVote === voteType) {
          // Toggle: clicking same button removes vote
          batch.delete(voteRef);
          // Decrement the count
          if (voteType === "up") {
            batch.update(commentRef, {
              upvoteCount: increment(-1),
            });
          } else {
            batch.update(commentRef, {
              downvoteCount: increment(-1),
            });
          }
        } else {
          // Changing vote (up to down or down to up)
          batch.update(voteRef, {
            voteType,
            timestamp: serverTimestamp(),
          });
          // Decrement old count, increment new count
          if (currentVote === "up") {
            batch.update(commentRef, {
              upvoteCount: increment(-1),
              downvoteCount: increment(1),
            });
          } else {
            batch.update(commentRef, {
              upvoteCount: increment(1),
              downvoteCount: increment(-1),
            });
          }
        }
      }

      await batch.commit();
    } catch (error) {
      console.error("Error voting on comment:", error);
      throw error;
    }
  }

  async getUserVotesForPosts(
    postIds: string[],
    userId: string,
  ): Promise<Map<string, "up" | "down">> {
    const votesMap = new Map<string, "up" | "down">();

    if (!userId || postIds.length === 0) {
      return votesMap;
    }

    try {
      // Fetch votes for all posts in parallel
      const votePromises = postIds.map(async (postId) => {
        const vote = await this.getUserVote(postId, userId, "post");
        if (vote) {
          votesMap.set(postId, vote);
        }
      });

      await Promise.all(votePromises);
    } catch (error) {
      console.error("Error getting user votes for posts:", error);
    }

    return votesMap;
  }

  async getUserVotesForComments(
    postId: string,
    commentIds: string[],
    userId: string,
  ): Promise<Map<string, "up" | "down">> {
    const votesMap = new Map<string, "up" | "down">();

    if (!userId || commentIds.length === 0) {
      return votesMap;
    }

    try {
      // Fetch votes for all comments in parallel
      const votePromises = commentIds.map(async (commentId) => {
        const vote = await this.getUserVote(
          postId,
          userId,
          "comment",
          commentId,
        );
        if (vote) {
          votesMap.set(commentId, vote);
        }
      });

      await Promise.all(votePromises);
    } catch (error) {
      console.error("Error getting user votes for comments:", error);
    }

    return votesMap;
  }
}

export const voteService = new VoteService();
