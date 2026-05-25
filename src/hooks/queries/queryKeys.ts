export const queryKeys = {
  stories: {
    all: () => ["stories"] as const,
    // Reserved for future non-category published list use-cases.
    published: () => ["stories", "published"] as const,
    byCategory: (category: string) =>
      ["stories", "published", category] as const,
    // Reserved for route-level detail migration.
    detail: (storyId: string) => ["stories", "detail", storyId] as const,
    chapters: (storyId: string) => ["stories", storyId, "chapters"] as const,
    chapter: (storyId: string, chapterId: string) =>
      ["stories", storyId, "chapters", chapterId] as const,
  },
  characters: {
    byStory: (storyId: string) => ["characters", storyId] as const,
  },
  places: {
    byStory: (storyId: string) => ["places", storyId] as const,
  },
  posts: {
    feed: (feedType: string) => ["posts", "feed", feedType] as const,
  },
  comments: {
    byChapter: (storyId: string, chapterId: string) =>
      ["comments", storyId, chapterId] as const,
  },
  bookClubs: {
    all: () => ["bookClubs"] as const,
    detail: (clubId: string) => ["bookClubs", clubId] as const,
  },
  user: {
    walletAddress: (userId: string) =>
      ["user", userId, "walletAddress"] as const,
    stories: (userId: string) => ["user", userId, "stories"] as const,
    recentlyRead: (userId: string) => ["user", userId, "recentlyRead"] as const,
  },
  earnings: {
    story: (storyId: string, chainId: number) =>
      ["earnings", "story", storyId, chainId] as const,
    lifetime: (walletAddress: string, chainId: number) =>
      ["earnings", "lifetime", walletAddress, chainId] as const,
  },
} as const;
