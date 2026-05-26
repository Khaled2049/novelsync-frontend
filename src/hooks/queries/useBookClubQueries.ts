import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { bookClubRepo } from "@/routes/BookClub/bookClubRepo";
import { IClub } from "@/types/IClub";

/**
 * Real-time book club hook backed by React Query cache.
 *
 * Same strategy as useComments:
 * 1. `useQuery` with `staleTime: Infinity` — React Query never background-refetches.
 * 2. `useEffect` runs `subscribeToBookClub` (onSnapshot internally), pushes updates
 *    into the cache via `queryClient.setQueryData`.
 * 3. Cleanup unsubscribes on unmount.
 */
export function useBookClub(clubId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.bookClubs.detail(clubId!);
  const enabled = !!clubId;

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = bookClubRepo.subscribeToBookClub(clubId!, (data) => {
      queryClient.setQueryData(queryKey, data ?? null);
    });

    return () => {
      unsubscribe();
      queryClient.removeQueries({ queryKey });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, queryClient]);

  return useQuery<IClub | null>({
    queryKey,
    queryFn: async () => null,
    enabled: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useBookClubs(enabled = true) {
  return useQuery<IClub[]>({
    queryKey: queryKeys.bookClubs.all(),
    queryFn: async () => {
      const clubs = await bookClubRepo.getBookClubs();
      return clubs ?? [];
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}
