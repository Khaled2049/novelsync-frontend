import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, firestore } from "../config/firebase";
import {
  uniqueNamesGenerator,
  adjectives,
  names,
} from "unique-names-generator";

export const useFirebaseAuth = () => {
  const [error, setError] = useState<string | null>(null);

  const createUserDocument = async (userId: string, userData: any) => {
    const dbUser = {
      username: userData.username,
      email: userData.email,
      createdAt: new Date().toISOString(),
      followers: ["default"],
      following: ["default"],
      stories: [],
      likedPosts: [],
      savedPosts: [],
      lastLogin: new Date().toISOString(),
      isAnonymous: userData.isAnonymous || false,
      aiUsage: 0,
      lastAiUsageDate: new Date().toISOString().split("T")[0],
    };

    await setDoc(doc(firestore, "users", userId), dbUser);
  };

  const handleEmailSignUp = async (
    email: string,
    password: string,
    username: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update the user's profile with the username
      await updateProfile(user, { displayName: username });

      // Create user document in Firestore
      await createUserDocument(user.uid, {
        username,
        email,
        isAnonymous: false,
      });

      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Create user document in Firestore
      await createUserDocument(user.uid, {
        username: user.displayName || "Google User",
        email: user.email || "",
        isAnonymous: false,
      });

      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleAnonymousSignUp = async () => {
    try {
      try {
        const anonymousUsername = uniqueNamesGenerator({
          dictionaries: [adjectives, names],
          separator: " ",
          style: "capital",
          length: 2,
        });

        console.log("anonymousUsername", anonymousUsername);

        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;

        await updateProfile(user, {
          displayName: anonymousUsername,
        });

        await createUserDocument(user.uid, {
          username: anonymousUsername,
          email: "",
          isAnonymous: true,
        });
      } catch (err) {
        console.log("err", err);
      }

      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const signin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Update last login time
      const user = auth.currentUser;

      if (user) {
        await setDoc(
          doc(firestore, "users", user.uid),
          {
            lastLogin: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      setError(null);
      return { status: 200 };
    } catch (err) {
      console.log("err", err);
      setError((err as Error).message);
      return { status: "error" };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const signout = async () => {
    try {
      await signOut(auth);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return {
    handleAnonymousSignUp,
    handleEmailSignUp,
    handleGoogleSignUp,
    signin,
    signout,
    forgotPassword,
    error,
  };
};
