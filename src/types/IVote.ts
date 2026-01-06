export interface IVote {
  userId: string;
  voteType: "up" | "down";
  timestamp: Date | any; // Firestore Timestamp compatible
}
