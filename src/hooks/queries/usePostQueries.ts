import { useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { queryKeys } from "./queryKeys";
import { postsService } from "@/services/PostService";
import { voteService } from "@/services/VoteService";
import { IPost } from "@/types/IPost";

type PageParam = QueryDocumentSnapshot<DocumentData> | undefined;

type PostPage = {
  posts: IPost[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
};

const POSTS_PER_PAGE = 10;

export function usePostFeed(
  feedType: string,
  userId: string | null | undefined,
) {
  return useInfiniteQuery<PostPage, Error, { pages: PostPage[] }, readonly unknown[], PageParam>({
    queryKey: [...queryKeys.posts.feed(feedType), userId] as const,
    queryFn: async ({ pageParam }) => {
      const fetcher =
        feedType === "popular"
          ? postsService.getPopularPosts.bind(postsService)
          : postsService.getTrendingPosts.bind(postsService);

      const result = await fetcher(POSTS_PER_PAGE, pageParam);

      if (userId && result.posts.length > 0) {
        const postIds = result.posts.map((p) => p.id);
        const userVotes = await voteService.getUserVotesForPosts(
          postIds,
          userId,
        );
        result.posts = result.posts.map((post) => ({
          ...post,
          userVote: userVotes.get(post.id) ?? null,
        }));
      }

      return result;
    },
    initialPageParam: undefined as PageParam,
    getNextPageParam: (lastPage) => lastPage.lastDoc ?? undefined,
  });
}

/** Remove a post from the infinite query cache without refetching. */
export function useRemovePostFromCache(
  feedType: string,
  userId: string | null | undefined,
) {
  const queryClient = useQueryClient();
  const queryKey = [...queryKeys.posts.feed(feedType), userId] as const;

  return useCallback(
    (postId: string) => {
      queryClient.setQueryData<{ pages: PostPage[]; pageParams: PageParam[] }>(
        queryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.filter((p) => p.id !== postId),
            })),
          };
        },
      );
    },
    // queryKey is an array literal — include the primitives it derives from
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, feedType, userId],
  );
}

/** Add a post optimistically to the top of the first page. */
export function useAddPostToCache(
  feedType: string,
  userId: string | null | undefined,
) {
  const queryClient = useQueryClient();
  const queryKey = [...queryKeys.posts.feed(feedType), userId] as const;

  return useCallback(
    (post: IPost) => {
      queryClient.setQueryData<{ pages: PostPage[]; pageParams: PageParam[] }>(
        queryKey,
        (old) => {
          if (!old || old.pages.length === 0) {
            return {
              pages: [{ posts: [post], lastDoc: null }],
              pageParams: [undefined],
            };
          }
          const [firstPage, ...restPages] = old.pages;
          return {
            ...old,
            pages: [
              { ...firstPage, posts: [post, ...firstPage.posts] },
              ...restPages,
            ],
          };
        },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, feedType, userId],
  );
}
