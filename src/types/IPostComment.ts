export interface IPostComment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorUsername: string;
  parentId: string | null;
  createdAt: Date | any; // Firestore Timestamp compatible
  updatedAt: Date | any; // Firestore Timestamp compatible
  upvoteCount: number;
  downvoteCount: number;
  userVote?: "up" | "down" | null; // Client-side only, not stored in Firestore
}
