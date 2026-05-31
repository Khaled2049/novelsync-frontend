import { create } from "zustand";
import { User as FirebaseUser } from "firebase/auth";
import { firestore } from "@/config/firebase";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { IUser } from "@/types/IUser";

export interface ProfileUpdateData {
  bio?: string;
  occupation?: string;
  location?: string;
  writingInterests?: string;
}

export interface AuthStore {
  user: IUser | null;
  loading: boolean;
  hydrateUser: (firebaseUser: FirebaseUser | null) => Promise<void>;
  fetchUsersOrderedByLastLogin: (userLimit: number) => Promise<IUser[]>;
  followUser: (uid: string) => Promise<void>;
  unfollowUser: (uid: string) => Promise<void>;
  updateBio: (bio: string) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
}

const getFallbackUser = (firebaseUser: FirebaseUser): IUser => ({
  ...firebaseUser,
  createdAt: new Date().toISOString(),
  username: firebaseUser.displayName || "",
  followers: ["default"],
  following: ["default"],
  stories: [],
  likedPosts: [],
  savedPosts: [],
  lastLogin: new Date().toISOString(),
  bio: "Write an about me section here...",
  occupation: "Occupation",
  location: "Location",
  walletAddress: undefined,
  aiUsage: 0,
  lastAiUsageDate: "",
});

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  hydrateUser: async (firebaseUser) => {
    if (!firebaseUser) {
      set({ user: null, loading: false });
      return;
    }

    try {
      const userDocRef = doc(firestore, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const tokenResult = await firebaseUser.getIdTokenResult();
        const newUser: IUser = {
          ...firebaseUser,
          ...userData,
          createdAt: userData.createdAt,
          username: userData.username,
          followers: userData.followers,
          following: userData.following,
          stories: userData.posts,
          likedPosts: userData.likedPosts,
          savedPosts: userData.savedPosts,
          lastLogin: userData.lastLogin,
          bio: userData.bio,
          occupation: userData.occupation,
          location: userData.location,
          writingInterests: userData.writingInterests,
          walletAddress: userData.walletAddress,
          hasCustomAiProvider: userData.hasCustomAiProvider === true,
          isAdmin: tokenResult.claims["admin"] === true,
          aiUsage: typeof userData.aiUsage === "number" ? userData.aiUsage : 0,
          lastAiUsageDate:
            typeof userData.lastAiUsageDate === "string"
              ? userData.lastAiUsageDate
              : "",
        };
        set({ user: newUser, loading: false });
        return;
      }

      set({ user: getFallbackUser(firebaseUser), loading: false });
    } catch (error) {
      console.error("Error hydrating authenticated user:", error);
      set({ user: null, loading: false });
      throw error;
    }
  },
  fetchUsersOrderedByLastLogin: async (userLimit) => {
    try {
      const usersCollection = collection(firestore, "users");
      const usersQuery = query(
        usersCollection,
        orderBy("lastLogin", "desc"),
        limit(userLimit),
      );
      const usersSnapshot = await getDocs(usersQuery);

      return usersSnapshot.docs.map((snapshot) => {
        const data = snapshot.data();
        return {
          ...data,
          uid: snapshot.id,
        } as IUser;
      });
    } catch (error) {
      console.error("Error fetching users ordered by last login:", error);
      throw new Error("Failed to fetch users");
    }
  },
  followUser: async (uid) => {
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    try {
      const targetUserRef = doc(firestore, "users", uid);
      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUser.uid),
      });

      await updateDoc(doc(firestore, "users", currentUser.uid), {
        following: arrayUnion(uid),
      });

      set((state) => ({
        user: state.user
          ? {
              ...state.user,
              // Mirror arrayUnion: only append if not already present
              following: state.user.following?.includes(uid)
                ? state.user.following
                : [...(state.user.following ?? []), uid],
            }
          : null,
      }));
    } catch (error) {
      console.error("Error following user:", error);
      throw new Error("Failed to follow user");
    }
  },
  unfollowUser: async (uid) => {
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    try {
      const targetUserRef = doc(firestore, "users", uid);
      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUser.uid),
      });

      await updateDoc(doc(firestore, "users", currentUser.uid), {
        following: arrayRemove(uid),
      });

      set((state) => ({
        user: state.user
          ? {
              ...state.user,
              following: (state.user.following ?? []).filter((id) => id !== uid),
            }
          : null,
      }));
    } catch (error) {
      console.error("Error unfollowing user:", error);
      throw new Error("Failed to unfollow user");
    }
  },
  updateBio: async (bio) => {
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    try {
      const userDocRef = doc(firestore, "users", currentUser.uid);
      await updateDoc(userDocRef, { bio });
      set((state) => ({
        user: state.user ? { ...state.user, bio } : null,
      }));
    } catch (error) {
      console.error("Error updating user bio:", error);
      throw new Error("Failed to update user profile");
    }
  },
  updateProfile: async (data) => {
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    try {
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
      );

      if (Object.keys(filteredData).length === 0) return;

      const userDocRef = doc(firestore, "users", currentUser.uid);
      await updateDoc(userDocRef, filteredData);

      set((state) => {
        if (!state.user) return state;
        return {
          user: {
            ...state.user,
            ...filteredData,
          },
        };
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new Error("Failed to update user profile");
    }
  },
}));
