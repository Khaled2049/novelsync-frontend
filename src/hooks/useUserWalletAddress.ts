import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { userService } from "@/services/UserService";

interface UseUserWalletAddressResult {
  walletAddress: string | null;
  loading: boolean;
  error: string | null;
  setWalletAddress: Dispatch<SetStateAction<string | null>>;
}

/**
 * Hook to fetch wallet address for a user
 * @param userId - The user's ID (optional, if not provided, returns null)
 * @returns Object with walletAddress, loading, and error states
 */
export const useUserWalletAddress = (
  userId: string | undefined | null,
): UseUserWalletAddressResult => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setWalletAddress(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchWalletAddress = async () => {
      setLoading(true);
      setError(null);
      try {
        const address = await userService.getUserWalletAddress(userId);
        setWalletAddress(address);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch wallet address";
        setError(errorMessage);
        setWalletAddress(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletAddress();
  }, [userId]);

  return { walletAddress, loading, error, setWalletAddress };
};
