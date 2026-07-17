import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { userService } from "@/services/UserService";
import { readingProgressService } from "@/services/ReadingProgressService";
import { publicProfileService } from "@/services/PublicProfileService";
import { useAuthStore } from "@/stores";

export function useWalletAddressQuery(userId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.user.walletAddress(userId!),
    queryFn: () => userService.getUserWalletAddress(userId!),
    enabled: !!userId,
    staleTime: Infinity, // wallet address rarely changes
  });
}

export function useSetWalletAddress(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useCallback(
    (address: string | null) => {
      if (!userId) return;
      queryClient.setQueryData(queryKeys.user.walletAddress(userId), address);
    },
    [queryClient, userId],
  );
}

export function usePublicProfile(userId: string | undefined) {
  const isSignedIn = useAuthStore((state) => !!state.user);
  return useQuery({
    queryKey: queryKeys.user.publicProfile(userId!),
    queryFn: () => publicProfileService.getPublicProfile(userId!),
    enabled: !!userId && isSignedIn,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Resolves an author's *current* username live from their public profile,
 * keyed by uid — so username changes propagate everywhere without rewriting
 * the denormalized copies stored on stories/posts/comments. Returns the stored
 * `fallback` while the profile query is in flight (or has no username), which
 * keeps names from flashing empty on first render.
 */
export function useAuthorUsername(
  userId: string | undefined,
  fallback?: string,
): string {
  const { data } = usePublicProfile(userId);
  return data?.username?.trim() || fallback?.trim() || "unknown";
}

export function useRecentlyRead(userId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: queryKeys.user.recentlyRead(userId!),
    queryFn: () => readingProgressService.getRecentlyRead(userId!, limit),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useClearReadingHistory(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => readingProgressService.clearAllProgress(userId!),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.user.recentlyRead(userId!), []);
    },
  });
}
