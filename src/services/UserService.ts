import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";

class UserService {
  /**
   * Get wallet address for a user from Firestore
   * @param userId - The user's ID
   * @returns The wallet address or null if not found
   */
  async getUserWalletAddress(userId: string): Promise<string | null> {
    try {
      const userDocRef = doc(firestore, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.walletAddress || null;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user wallet address:", error);
      throw new Error("Failed to fetch user wallet address");
    }
  }

  /**
   * Update wallet address for a user in Firestore
   * @param userId - The user's ID
   * @param address - The wallet address to save
   */
  async updateUserWalletAddress(
    userId: string,
    address: string
  ): Promise<void> {
    try {
      const userDocRef = doc(firestore, "users", userId);
      await updateDoc(userDocRef, {
        walletAddress: address,
      });
    } catch (error) {
      console.error("Error updating user wallet address:", error);
      throw new Error("Failed to update user wallet address");
    }
  }
}

export const userService = new UserService();

