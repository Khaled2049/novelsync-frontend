import { type Dispatch, type SetStateAction } from "react";
import {
  useWalletAddressQuery,
  useSetWalletAddress,
} from "@/hooks/queries/useUserQueries";

interface UseUserWalletAddressResult {
  walletAddress: string | null;
  loading: boolean;
  error: string | null;
  setWalletAddress: Dispatch<SetStateAction<string | null>>;
}

/**
 * Hook to fetch wallet address for a user.
 * Backed by TanStack Query — results are cached and deduplicated.
 */
export const useUserWalletAddress = (
  userId: string | undefined | null,
): UseUserWalletAddressResult => {
  const {
    data: walletAddress = null,
    isLoading,
    error,
  } = useWalletAddressQuery(userId);
  const setInCache = useSetWalletAddress(userId);

  // Preserve the Dispatch<SetStateAction<string | null>> interface for existing callers.
  // When called as a setter function (value or updater), it writes to the query cache.
  const setWalletAddress: Dispatch<SetStateAction<string | null>> = (
    valueOrUpdater,
  ) => {
    const next =
      typeof valueOrUpdater === "function"
        ? valueOrUpdater(walletAddress)
        : valueOrUpdater;
    setInCache(next);
  };

  return {
    walletAddress,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
    setWalletAddress,
  };
};
