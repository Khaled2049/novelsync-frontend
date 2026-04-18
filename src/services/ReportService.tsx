import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";

class ReportService {
  private postsCollection = collection(firestore, "posts");

  private getPostReportsCollection(postId: string) {
    return collection(doc(this.postsCollection, postId), "reports");
  }

  async hasUserReported(postId: string, userId: string): Promise<boolean> {
    try {
      const reportsCollection = this.getPostReportsCollection(postId);
      const reportDoc = await getDoc(doc(reportsCollection, userId));
      return reportDoc.exists();
    } catch (error) {
      console.error("Error checking if user reported:", error);
      return false;
    }
  }

  async reportPost(
    postId: string,
    userId: string,
    reason?: string,
  ): Promise<void> {
    try {
      const reportsCollection = this.getPostReportsCollection(postId);
      const reportRef = doc(reportsCollection, userId);
      const postRef = doc(this.postsCollection, postId);

      // Get post data first (before deletion)
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        throw new Error("Post not found");
      }
      const postData = postDoc.data();
      const authorId = postData.authorId;

      // Check if this is the first report
      const reportsSnapshot = await getDocs(query(reportsCollection));
      const isFirstReport = reportsSnapshot.empty;

      const batch = writeBatch(firestore);

      // Add the report - only include reason if it's provided
      const reportData: any = {
        userId,
        timestamp: serverTimestamp(),
      };
      if (reason && reason.trim()) {
        reportData.reason = reason.trim();
      }
      batch.set(reportRef, reportData);

      // If this is the first report, delete the post and all related data
      if (isFirstReport) {
        // Delete all comments and their subcollections
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

        // Delete all reports (including the one we just added)
        const reportsSnapshot2 = await getDocs(reportsCollection);
        reportsSnapshot2.forEach((reportDoc) => {
          batch.delete(reportDoc.ref);
        });

        // Delete the post document itself
        batch.delete(postRef);

        // Also delete from user's posts subcollection if it exists
        if (authorId) {
          const userPostsCollection = collection(
            doc(collection(firestore, "users"), authorId),
            "posts",
          );
          const userPostRef = doc(userPostsCollection, postId);
          batch.delete(userPostRef);
        }
      }

      await batch.commit();
    } catch (error) {
      console.error("Error reporting post:", error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
