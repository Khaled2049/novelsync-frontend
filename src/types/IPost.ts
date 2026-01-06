export interface IPost {
  id: string;
  content: string;
  createdAt: Date | any; // Firestore Timestamp compatible
  authorName: string;
  authorId: string;
  bookClubId?: string;
  commentCount: number;
  upvoteCount: number;
  downvoteCount: number;
  userVote?: "up" | "down" | null; // Client-side only, not stored in Firestore
}
