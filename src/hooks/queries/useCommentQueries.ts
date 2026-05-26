import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { queryKeys } from "./queryKeys";
import { CommentService } from "@/services/CommentService";
import { Comment } from "@/types/IComment";

const commentService = new CommentService();

/**
 * Real-time comments hook backed by React Query cache.
 *
 * Strategy:
 * 1. `useQuery` with `staleTime: Infinity` seeds the cache — React Query never
 *    background-refetches (the Firestore snapshot is the source of truth).
 * 2. A `useEffect` runs `onSnapshot`, pushing updates into the cache via
 *    `queryClient.setQueryData`.
 * 3. On unmount, the `useEffect` cleanup unsubscribes Firestore.
 */
export function useComments(
  storyId: string | undefined,
  chapterId: string | undefined,
) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.comments.byChapter(storyId!, chapterId!);
  const enabled = !!storyId && !!chapterId;

  useEffect(() => {
    if (!enabled) return;

    const commentsCollection = commentService.getCommentsCollection(
      storyId!,
      chapterId!,
    );
    const q = query(commentsCollection, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const comments: Comment[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            storyId: storyId!,
            chapterId: chapterId!,
            message: data.message,
            userId: data.userId,
            parentId: data.parentId || null,
            likes: data.likes || [],
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            username: data.username,
          };
        });
        queryClient.setQueryData(queryKey, comments);
      },
      (error) => {
        console.error("Error listening to comments:", error);
        // Leave existing cache value on error
      },
    );

    return () => {
      unsubscribe();
      queryClient.removeQueries({ queryKey });
    };
    // queryKey is derived from storyId/chapterId — include primitives directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, chapterId, queryClient]);

  return useQuery<Comment[]>({
    queryKey,
    queryFn: async () => [],
    enabled: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
