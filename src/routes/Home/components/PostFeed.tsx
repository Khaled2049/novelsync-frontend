import React, { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { IPost } from "@/types/IPost";
import { IUser } from "@/types/IUser";
import { postsService } from "@/services/PostService";
import PostCard from "./PostCard";
import PostCreationForm from "./PostCreationForm";
import { FeedType } from "./FeedNavigation";
import { useBookClubs } from "@/hooks/queries/useBookClubQueries";
import {
  usePostFeed,
  useRemovePostFromCache,
  useAddPostToCache,
} from "@/hooks/queries/usePostQueries";

interface PostFeedProps {
  currentUser: IUser | null;
  feedType?: FeedType;
}

const PostFeed: React.FC<PostFeedProps> = ({
  currentUser,
  feedType = "home",
}) => {
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = currentUser?.uid ?? null;

  const {
    data,
    isLoading,
    isError,
    error: feedError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = usePostFeed(feedType, userId);

  const removePost = useRemovePostFromCache(feedType, userId);
  const addPost = useAddPostToCache(feedType, userId);
  const {
    data: bookClubs = [],
    isError: bookClubsError,
    error: bookClubsErrorValue,
  } = useBookClubs(!!currentUser);

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handlePostDeleted = (postId: string) => {
    removePost(postId);
  };

  const handlePostSubmit = async (content: string, bookClubId?: string) => {
    if (!currentUser) return;

    setIsPosting(true);
    setError(null);

    const tempId = `temp-${Date.now()}`;
    const optimisticPost: IPost = {
      id: tempId,
      content,
      createdAt: new Date(),
      authorName: currentUser.displayName || currentUser.email || "You",
      authorId: currentUser.uid,
      bookClubId,
      commentCount: 0,
      upvoteCount: 0,
      downvoteCount: 0,
      userVote: null,
    };

    addPost(optimisticPost);

    try {
      const postId = await postsService.addPost(currentUser.uid, {
        content,
        bookClubId,
        upvoteCount: 0,
        downvoteCount: 0,
      });
      // Replace temp post with real ID
      removePost(tempId);
      addPost({ ...optimisticPost, id: postId });
    } catch (err: any) {
      console.error("Error creating post:", err);
      removePost(tempId);
      if (
        err?.code === "RATE_LIMIT_EXCEEDED" ||
        err?.message?.includes("daily limit")
      ) {
        setError(
          err.message ||
            "You have reached the daily post limit. Please try again tomorrow.",
        );
      } else {
        setError("Failed to create post. Please try again.");
      }
    } finally {
      setIsPosting(false);
    }
  };

  const getBookClubName = (clubId?: string) => {
    if (!clubId) return undefined;
    return bookClubs.find((club) => club.id === clubId)?.name;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader className="animate-spin text-ns-accent" size={28} />
      </div>
    );
  }

  return (
    <div>
      {currentUser && (
        <PostCreationForm
          onSubmit={handlePostSubmit}
          bookClubs={bookClubs}
          isLoading={isPosting}
        />
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-ns-accent-subtle border border-ns-accent/20 rounded-ns font-ui text-sm text-ns-destructive">
          {error}
        </div>
      )}
      {isError && (
        <div className="mb-4 px-4 py-3 bg-ns-accent-subtle border border-ns-destructive/20 rounded-ns font-ui text-sm text-ns-destructive">
          {feedError instanceof Error
            ? feedError.message
            : "Failed to load posts. Please refresh and try again."}
        </div>
      )}
      {bookClubsError && (
        <div className="mb-4 px-4 py-3 bg-ns-accent-subtle border border-ns-destructive/20 rounded-ns font-ui text-sm text-ns-destructive">
          {bookClubsErrorValue instanceof Error
            ? bookClubsErrorValue.message
            : "Failed to load book clubs."}
        </div>
      )}

      {posts.length === 0 && !isLoading ? (
        <div className="text-center py-16">
          <p className="font-heading text-title font-light text-ns-ink-muted mb-1">
            No posts yet
          </p>
          <p className="font-ui text-sm text-ns-ink-muted">
            Be the first to share your thoughts.
          </p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              bookClubName={getBookClubName(post.bookClubId)}
              onPostDeleted={handlePostDeleted}
            />
          ))}

          <div
            ref={loadMoreRef}
            className="h-10 flex items-center justify-center"
          >
            {isFetchingNextPage && (
              <Loader className="animate-spin text-ns-accent" size={20} />
            )}
          </div>

          {!hasNextPage && posts.length > 0 && (
            <div className="text-center py-8">
              <p className="font-ui text-xs text-ns-ink-muted tracking-wide">
                · · ·
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostFeed;
