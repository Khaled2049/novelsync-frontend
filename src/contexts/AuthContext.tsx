import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "../config/firebase";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { IUser } from "../types/IUser";
import { collection } from "firebase/firestore";

export interface ProfileUpdateData {
  bio?: string;
  occupation?: string;
  location?: string;
}

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  fetchUsersOrderedByLastLogin: (userLimit: number) => Promise<IUser[]>;
  followUser: (uid: string) => Promise<void>;
  unfollowUser: (uid: string) => Promise<void>;
  updateBio: (uid: string, bio: string) => Promise<void>;
  updateProfile: (uid: string, data: ProfileUpdateData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const newUser = {
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
            aiUsage: userData.aiUsage || 0,
            lastAiUsageDate:
              userData.lastAiUsageDate ||
              new Date().toISOString().split("T")[0],
            walletAddress: userData.walletAddress,
          };
          setUser(newUser);
        } else {
          const newUser: IUser = {
            ...firebaseUser,
            createdAt: new Date().toISOString(),
            username: user?.displayName || "",
            followers: ["default"],
            following: ["default"],
            stories: [],
            likedPosts: [],
            savedPosts: [],
            lastLogin: new Date().toISOString(),
            bio: "Write an about me section here...",
            occupation: "Occupation",
            location: "Location",
            aiUsage: 0,
            lastAiUsageDate: new Date().toISOString().split("T")[0],
            walletAddress: undefined,
          };
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUsersOrderedByLastLogin = async (
    userLimit: number,
  ): Promise<IUser[]> => {
    try {
      const usersCollection = collection(firestore, "users");
      const usersQuery = query(
        usersCollection,
        orderBy("lastLogin", "desc"),
        limit(userLimit),
      );
      const usersSnapshot = await getDocs(usersQuery);

      const users: IUser[] = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          uid: doc.id,
        } as IUser;
      });

      return users;
    } catch (error) {
      console.error("Error fetching users ordered by last login:", error);
      throw new Error("Failed to fetch users");
    }
  };

  const followUser = async (uid: string) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const userDocRef = doc(firestore, "users", uid);

      await updateDoc(userDocRef, {
        followers: arrayUnion(user.uid),
      });

      await updateDoc(doc(firestore, "users", user.uid), {
        following: arrayUnion(uid),
      });
    } catch (error) {
      console.error("Error following user:", error);
      throw new Error("Failed to follow user");
    }
  };

  const unfollowUser = async (uid: string) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const userDocRef = doc(firestore, "users", uid);

      await updateDoc(userDocRef, {
        followers: arrayRemove(user.uid),
      });

      await updateDoc(doc(firestore, "users", user.uid), {
        following: arrayRemove(uid),
      });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      throw new Error("Failed to unfollow user");
    }
  };

  const updateBio = async (uid: string, bio: string) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const userDocRef = doc(firestore, "users", uid);

      await updateDoc(userDocRef, {
        bio: bio,
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new Error("Failed to update user profile");
    }
  };

  const updateProfile = async (uid: string, data: ProfileUpdateData) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      // Filter out undefined values
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
      );

      if (Object.keys(filteredData).length === 0) {
        return;
      }

      const userDocRef = doc(firestore, "users", uid);
      await updateDoc(userDocRef, filteredData);

      // Update local state
      setUser((prevUser) => {
        if (!prevUser) return prevUser;
        return {
          ...prevUser,
          ...filteredData,
        };
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new Error("Failed to update user profile");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        fetchUsersOrderedByLastLogin,
        followUser,
        unfollowUser,
        updateBio,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an EditorProvider");
  }
  return context;
};
