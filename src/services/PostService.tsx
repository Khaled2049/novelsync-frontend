import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  increment,
  where,
  serverTimestamp,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { IPost } from "@/types/IPost";
import { voteService } from "./VoteService";
import { rateLimitService } from "./RateLimitService";

class PostsService {
  private usersCollection = collection(firestore, "users");
  private allPostsCollection = collection(firestore, "posts");

  async getPosts(userId: string): Promise<IPost[]> {
    try {
      const postsCollection = collection(this.usersCollection, userId, "posts");
      const postsSnapshot = await getDocs(postsCollection);
      return postsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          upvoteCount: data.upvoteCount || 0,
          downvoteCount: data.downvoteCount || 0,
        } as IPost;
      });
    } catch (error) {
      console.error("Error getting posts:", error);
      throw error;
    }
  }

  // gets all posts created by any user
  async getAllPosts(): Promise<IPost[]> {
    try {
      // Query Firestore to get the latest 5 posts
      const postsQuery = query(
        this.allPostsCollection,
        orderBy("createdAt", "desc"), // Sort by createdAt descending
        limit(5), // Limit to 5 results
      );

      const postsSnapshot = await getDocs(postsQuery);
      return postsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          upvoteCount: data.upvoteCount || 0,
          downvoteCount: data.downvoteCount || 0,
        } as IPost;
      });
    } catch (error) {
      console.error("Error getting latest posts:", error);
      throw error;
    }
  }

  // Get trending posts sorted by recency (most recent first)
  async getTrendingPosts(
    limitCount: number = 20,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
  ): Promise<{
    posts: IPost[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }> {
    try {
      let postsQuery;
      if (lastDoc) {
        postsQuery = query(
          this.allPostsCollection,
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(limitCount),
        );
      } else {
        postsQuery = query(
          this.allPostsCollection,
          orderBy("createdAt", "desc"),
          limit(limitCount),
        );
      }

      const postsSnapshot = await getDocs(postsQuery);
      const posts = postsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          upvoteCount: data.upvoteCount || 0,
          downvoteCount: data.downvoteCount || 0,
        } as IPost;
      });

      const newLastDoc =
        postsSnapshot.docs.length > 0
          ? postsSnapshot.docs[postsSnapshot.docs.length - 1]
          : null;

      return { posts, lastDoc: newLastDoc };
    } catch (error) {
      console.error("Error getting trending posts:", error);
      throw error;
    }
  }

  // Get popular posts sorted by upvotes (most upvoted first)
  async getPopularPosts(
    limitCount: number = 20,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
  ): Promise<{
    posts: IPost[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }> {
    try {
      let postsQuery;
      if (lastDoc) {
        postsQuery = query(
          this.allPostsCollection,
          orderBy("upvoteCount", "desc"),
          startAfter(lastDoc),
          limit(limitCount),
        );
      } else {
        postsQuery = query(
          this.allPostsCollection,
          orderBy("upvoteCount", "desc"),
          limit(limitCount),
        );
      }

      const postsSnapshot = await getDocs(postsQuery);
      const posts = postsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          upvoteCount: data.upvoteCount || 0,
          downvoteCount: data.downvoteCount || 0,
        } as IPost;
      });

      // Sort by upvoteCount descending, then by createdAt descending as tiebreaker
      // This ensures consistent ordering even if multiple posts have the same upvote count
      posts.sort((a, b) => {
        const upvoteDiff = (b.upvoteCount || 0) - (a.upvoteCount || 0);
        if (upvoteDiff !== 0) return upvoteDiff;

        // If upvotes are equal, sort by most recent
        const dateA =
          a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB =
          b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      const newLastDoc =
        postsSnapshot.docs.length > 0
          ? postsSnapshot.docs[postsSnapshot.docs.length - 1]
          : null;

      return { posts, lastDoc: newLastDoc };
    } catch (error) {
      console.error("Error getting popular posts:", error);
      throw error;
    }
  }

  // Get posts by book club
  async getPostsByBookClub(clubId: string): Promise<IPost[]> {
    try {
      const postsQuery = query(
        this.allPostsCollection,
        where("bookClubId", "==", clubId),
        orderBy("createdAt", "desc"),
      );

      const postsSnapshot = await getDocs(postsQuery);
      return postsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          upvoteCount: data.upvoteCount || 0,
          downvoteCount: data.downvoteCount || 0,
        } as IPost;
      });
    } catch (error) {
      console.error("Error getting posts by book club:", error);
      throw error;
    }
  }

  async addPost(
    userId: string,
    post: Omit<
      IPost,
      "id" | "createdAt" | "authorId" | "authorUsername" | "commentCount"
    > & {
      bookClubId?: string;
      authorUsername?: string;
    },
  ): Promise<string> {
    try {
      // Check rate limit before creating post
      const rateLimitCheck = await rateLimitService.canCreatePost(userId);
      if (!rateLimitCheck.allowed) {
        const error = new Error(
          rateLimitCheck.message || "Rate limit exceeded",
        );
        (error as any).code = "RATE_LIMIT_EXCEEDED";
        (error as any).count = rateLimitCheck.count;
        (error as any).limit = rateLimitCheck.limit;
        throw error;
      }

      const postsRef = doc(this.usersCollection, userId);
      const postsCollection = collection(postsRef, "posts");
      const newPostRef = doc(postsCollection);

      // Build post object, only including bookClubId if it's provided
      const newPost: any = {
        id: newPostRef.id,
        createdAt: serverTimestamp(),
        content: post.content,
        authorUsername: post.authorUsername || "unknown",
        authorId: userId,
        commentCount: 0,
        upvoteCount: 0,
        downvoteCount: 0,
      };

      // Only add bookClubId if it's provided and not undefined
      if (post.bookClubId) {
        newPost.bookClubId = post.bookClubId;
      }

      await setDoc(newPostRef, newPost);

      // Add post to allPosts collection
      await setDoc(doc(this.allPostsCollection, newPostRef.id), newPost);

      // Increment post count for rate limiting
      await rateLimitService.incrementPostCount(userId);

      return newPostRef.id;
    } catch (error) {
      console.error("Error adding post:", error);
      throw error;
    }
  }

  async incrementCommentCount(postId: string): Promise<void> {
    try {
      const postRef = doc(this.allPostsCollection, postId);
      await updateDoc(postRef, {
        commentCount: increment(1),
      });
    } catch (error) {
      console.error("Error incrementing comment count:", error);
      throw error;
    }
  }

  async getFollowingPosts(userId: string): Promise<IPost[]> {
    try {
      const userDoc = doc(this.usersCollection, userId);
      const userDocSnap = await getDoc(userDoc);
      const userData = userDocSnap.data();

      if (!userData) {
        throw new Error("User not found");
      }

      const followingPosts: IPost[] = [];
      const following = userData.following || [];
      for (const followingId of following) {
        const posts = await this.getPosts(followingId);
        followingPosts.push(...posts);
      }

      // Sort by createdAt descending
      return followingPosts.sort((a, b) => {
        const dateA =
          a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB =
          b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error("Error getting following posts:", error);
      throw error;
    }
  }

  async getPostsWithUserVotes(
    postIds: string[],
    userId: string,
  ): Promise<IPost[]> {
    try {
      // Fetch posts
      const posts: IPost[] = [];
      for (const postId of postIds) {
        const postDoc = await getDoc(doc(this.allPostsCollection, postId));
        if (postDoc.exists()) {
          const data = postDoc.data();
          posts.push({
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            upvoteCount: data.upvoteCount || 0,
            downvoteCount: data.downvoteCount || 0,
          } as IPost);
        }
      }

      // Fetch user votes and merge
      const userVotes = await voteService.getUserVotesForPosts(postIds, userId);
      return posts.map((post) => ({
        ...post,
        userVote: userVotes.get(post.id) || null,
      }));
    } catch (error) {
      console.error("Error getting posts with user votes:", error);
      throw error;
    }
  }

  async deletePost(postId: string, authorId: string): Promise<void> {
    try {
      const batch = writeBatch(firestore);
      const postRef = doc(this.allPostsCollection, postId);

      // Get post document to verify it exists
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        throw new Error("Post not found");
      }

      // Delete all comments and their votes
      const commentsCollection = collection(postRef, "comments");
      const commentsSnapshot = await getDocs(commentsCollection);

      for (const commentDoc of commentsSnapshot.docs) {
        // Delete comment votes
        const commentVotesCollection = collection(
          commentsCollection,
          commentDoc.id,
          "votes",
        );
        const votesSnapshot = await getDocs(commentVotesCollection);
        votesSnapshot.forEach((voteDoc) => {
          batch.delete(voteDoc.ref);
        });

        // Delete the comment
        batch.delete(commentDoc.ref);
      }

      // Delete all post votes
      const votesCollection = collection(postRef, "votes");
      const votesSnapshot = await getDocs(votesCollection);
      votesSnapshot.forEach((voteDoc) => {
        batch.delete(voteDoc.ref);
      });

      // Delete all reports
      const reportsCollection = collection(postRef, "reports");
      const reportsSnapshot = await getDocs(reportsCollection);
      reportsSnapshot.forEach((reportDoc) => {
        batch.delete(reportDoc.ref);
      });

      // Delete the post from allPostsCollection
      batch.delete(postRef);

      // Delete from user's posts subcollection
      const userPostsCollection = collection(
        doc(this.usersCollection, authorId),
        "posts",
      );
      const userPostRef = doc(userPostsCollection, postId);
      batch.delete(userPostRef);

      // Execute all deletions in single batch
      await batch.commit();
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }
}

export const postsService = new PostsService();
