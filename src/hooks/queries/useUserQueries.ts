import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { userService } from "@/services/UserService";
import { readingProgressService } from "@/services/ReadingProgressService";

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
