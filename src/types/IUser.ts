import { User as FirebaseUser } from "firebase/auth";

export interface IUser extends FirebaseUser {
  username: string;
  followers: string[];
  following: string[];
  createdAt: string;
  lastLogin: string;
  stories: string[];
  likedPosts: string[];
  savedPosts: string[];
  occupation: string;
  bio: string;
  location: string;
  walletAddress?: string;
  hasCustomAiProvider?: boolean;
  isAdmin?: boolean;
  aiUsage?: number;
  lastAiUsageDate?: string;
}
