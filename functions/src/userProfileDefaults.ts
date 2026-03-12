import { FieldValue } from "firebase-admin/firestore";

export interface UserProfileDefaultsInput {
  username: string;
  email: string;
  walletAddress?: string;
}

export interface UserProfileDocument {
  username: string;
  email: string;
  createdAt: string;
  followers: string[];
  following: string[];
  stories: string[];
  posts: string[];
  likedPosts: string[];
  savedPosts: string[];
  lastLogin: string;
  isAnonymous: boolean;
  aiUsage: number;
  lastAiUsageDate: string;
  bio: string;
  occupation: string;
  location: string;
  walletAddress?: string;
  updatedAt: FieldValue;
}

export function buildUserProfileDefaults(
  input: UserProfileDefaultsInput
): UserProfileDocument {
  const nowIso = new Date().toISOString();
  const today = nowIso.split("T")[0];

  return {
    username: input.username,
    email: input.email,
    createdAt: nowIso,
    followers: ["default"],
    following: ["default"],
    stories: [],
    posts: [],
    likedPosts: [],
    savedPosts: [],
    lastLogin: nowIso,
    isAnonymous: false,
    aiUsage: 0,
    lastAiUsageDate: today,
    bio: "Write an about me section here...",
    occupation: "Occupation",
    location: "Location",
    ...(input.walletAddress ? { walletAddress: input.walletAddress } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  };
}
