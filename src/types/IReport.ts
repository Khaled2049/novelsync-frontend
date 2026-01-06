export interface IReport {
  userId: string;
  reason?: string;
  timestamp: Date | any; // Firestore Timestamp compatible
}
