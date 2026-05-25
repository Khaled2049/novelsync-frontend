import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { formatEther, formatUnits } from "viem";
import { queryKeys } from "./queryKeys";
import { storiesRepo } from "@/services/StoriesRepo";
import {
  tippingPlatformConfig,
  ZERO_ADDRESS,
} from "@/blockchain/tippingPlatform";
import { USDC_ADDRESS } from "@/blockchain/tokens";

const toBigInt = (value: unknown): bigint => {
  if (typeof value === "bigint") return value;
  return 0n;
};

export type StoryWithEarnings = Awaited<
  ReturnType<typeof storiesRepo.getUserStories>
>[number] & {
  earnings: {
    eth: string;
    usdc: string;
  };
};

export function usePublishedStories(category: string) {
  return useQuery({
    queryKey: queryKeys.stories.byCategory(category),
    queryFn: () =>
      category === "all"
        ? storiesRepo.getPublishedStories()
        : storiesRepo.getPublishedStoriesByCategory(category),
    staleTime: 1000 * 60 * 5, // 5 min — story lists are low-churn
  });
}

/**
 * Fetches user's own stories and their on-chain earnings in one query.
 * Earnings are fetched in parallel (fixes the N+1 problem).
 */
export function useUserStoriesWithEarnings(userId: string | undefined) {
  const publicClient = usePublicClient();
  const chainId = publicClient?.chain?.id;

  return useQuery<StoryWithEarnings[]>({
    // Include chainId so a network switch invalidates stale earnings data.
    queryKey: [...queryKeys.user.stories(userId!), chainId] as const,
    queryFn: async () => {
      const storyList = await storiesRepo.getUserStories(userId!);
      return Promise.all(
        storyList.map(async (story) => {
          const [ethRaw, usdcRaw] = await Promise.all([
            publicClient!
              .readContract({
                ...tippingPlatformConfig,
                functionName: "storyEarnings",
                args: [story.id, ZERO_ADDRESS],
              })
              .catch(() => 0n),
            publicClient!
              .readContract({
                ...tippingPlatformConfig,
                functionName: "storyEarnings",
                args: [story.id, USDC_ADDRESS as `0x${string}`],
              })
              .catch(() => 0n),
          ]);

          return {
            ...story,
            earnings: {
              eth: formatEther(toBigInt(ethRaw)),
              usdc: formatUnits(toBigInt(usdcRaw), 6),
            },
          };
        }),
      );
    },
    enabled: !!userId && !!publicClient && !!chainId,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useDeleteStory(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) => storiesRepo.deleteStory(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.stories(userId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stories.all(),
      });
    },
  });
}

export function useTogglePublishStory(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) => storiesRepo.handlePublish(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.stories(userId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stories.all(),
      });
    },
  });
}

export function useUpdateStoryMetadata(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      storyId,
      data,
    }: {
      storyId: string;
      data: {
        title: string;
        description: string;
        category?: string;
        tags?: string[];
      };
    }) => storiesRepo.updateStoryMetadata(storyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.stories(userId!),
      });
    },
  });
}

export function useUpdateStoryCover(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      storyId,
      imageFile,
      previewUrl,
    }: {
      storyId: string;
      imageFile: File | null;
      previewUrl: string | null;
    }) => storiesRepo.updateStoryCoverImage(storyId, imageFile, previewUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.stories(userId!),
      });
    },
  });
}
