import React, { useEffect, useState, useCallback, useRef } from "react";
import { Loader } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { IPost } from "@/types/IPost";
import { IUser } from "@/types/IUser";
import { IClub } from "@/types/IClub";
import { postsService } from "@/services/PostService";
import { voteService } from "@/services/VoteService";
import { bookClubRepo } from "@/routes/BookClub/bookClubRepo";
import PostCard from "./PostCard";
import PostCreationForm from "./PostCreationForm";
import { FeedType } from "./FeedNavigation";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

interface PostFeedProps {
  currentUser: IUser | null;
  feedType?: FeedType;
}

const PostFeed: React.FC<PostFeedProps> = ({
  currentUser,
  feedType = "home",
}) => {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [bookClubs, setBookClubs] = useState<IClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    const fetchBookClubs = async () => {
      try {
        const clubs = await bookClubRepo.getBookClubs();
        setBookClubs(clubs || []);
      } catch (error) {
        console.error("Error fetching book clubs:", error);
      }
    };
    if (currentUser) {
      fetchBookClubs();
    }
  }, [currentUser]);

  const handlePostDeleted = (postId: string) => {
    // Optimistically remove post from feed
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  const loadPosts = useCallback(
    async (isInitialLoad: boolean = false) => {
      if (loadingRef.current) return;

      try {
        if (isInitialLoad) {
          setIsLoading(true);
          setLastDoc(null);
          setHasMore(true);
        } else {
          setIsLoadingMore(true);
        }
        setError(null);
        loadingRef.current = true;

        let result;
        switch (feedType) {
          case "popular":
            result = await postsService.getPopularPosts(
              POSTS_PER_PAGE,
              isInitialLoad ? undefined : lastDoc || undefined
            );
            break;
          case "home":
          default:
            result = await postsService.getTrendingPosts(
              POSTS_PER_PAGE,
              isInitialLoad ? undefined : lastDoc || undefined
            );
            break;
        }

        const { posts: fetchedPosts, lastDoc: newLastDoc } = result;

        // Check if we have more posts to load
        if (fetchedPosts.length < POSTS_PER_PAGE) {
          setHasMore(false);
        }

        // Fetch user votes and merge into posts
        if (currentUser && fetchedPosts.length > 0) {
          const postIds = fetchedPosts.map((p) => p.id);
          const userVotes = await voteService.getUserVotesForPosts(
            postIds,
            currentUser.uid
          );
          fetchedPosts.forEach((post) => {
            post.userVote = userVotes.get(post.id) || null;
          });
        }

        if (isInitialLoad) {
          setPosts(fetchedPosts);
        } else {
          setPosts((prevPosts) => [...prevPosts, ...fetchedPosts]);
        }

        setLastDoc(newLastDoc);
      } catch (err) {
        console.error("Error loading posts:", err);
        setError("Failed to load posts. Please try again.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [feedType, currentUser, lastDoc]
  );

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "200px", // Start loading 200px before reaching the bottom
  });

  // Initial load when feedType or currentUser changes
  useEffect(() => {
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedType, currentUser?.uid]);

  // Load more when scrolling near bottom
  useEffect(() => {
    if (
      inView &&
      hasMore &&
      !isLoading &&
      !isLoadingMore &&
      !loadingRef.current &&
      posts.length > 0 // Only load more if we already have posts
    ) {
      loadPosts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, isLoading, isLoadingMore]);

  const handlePostSubmit = async (content: string, bookClubId?: string) => {
    if (!currentUser) return;

    setIsPosting(true);
    setError(null);

    // Create optimistic post
    const tempId = `temp-${Date.now()}`;
    const optimisticPost: IPost = {
      id: tempId, // Temporary ID
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

    // Add optimistic post to the top of the list immediately
    setPosts((prevPosts) => [optimisticPost, ...prevPosts]);

    try {
      const postId = await postsService.addPost(currentUser.uid, {
        content,
        bookClubId,
        upvoteCount: 0,
        downvoteCount: 0,
      });

      // Update the optimistic post with the real postId
      // The post will remain at the top since it's the newest
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === tempId ? { ...post, id: postId } : post
        )
      );
    } catch (err: any) {
      console.error("Error creating post:", err);
      // Remove optimistic post on error
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== tempId));

      // Check if it's a rate limit error
      if (
        err?.code === "RATE_LIMIT_EXCEEDED" ||
        err?.message?.includes("daily limit")
      ) {
        setError(
          err.message ||
            "You have reached the daily post limit. Please try again tomorrow."
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
      <div className="flex justify-center items-center py-12">
        <Loader
          className="animate-spin text-dark-green dark:text-light-green"
          size={32}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Post Creation Form */}
      {currentUser && (
        <PostCreationForm
          onSubmit={handlePostSubmit}
          bookClubs={bookClubs}
          isLoading={isPosting}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 && !isLoading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">No posts yet</p>
          <p className="text-sm">Be the first to share your thoughts!</p>
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

          {/* Infinite scroll trigger */}
          <div
            ref={loadMoreRef}
            className="h-10 flex items-center justify-center"
          >
            {isLoadingMore && (
              <Loader
                className="animate-spin text-dark-green dark:text-light-green"
                size={24}
              />
            )}
          </div>

          {/* End of feed message */}
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">You've reached the end of the feed</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostFeed;
