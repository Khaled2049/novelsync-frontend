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
    if (currentUser) fetchBookClubs();
  }, [currentUser]);

  const handlePostDeleted = (postId: string) => {
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
              isInitialLoad ? undefined : lastDoc || undefined,
            );
            break;
          case "home":
          default:
            result = await postsService.getTrendingPosts(
              POSTS_PER_PAGE,
              isInitialLoad ? undefined : lastDoc || undefined,
            );
            break;
        }

        const { posts: fetchedPosts, lastDoc: newLastDoc } = result;

        if (fetchedPosts.length < POSTS_PER_PAGE) setHasMore(false);

        if (currentUser && fetchedPosts.length > 0) {
          const postIds = fetchedPosts.map((p) => p.id);
          const userVotes = await voteService.getUserVotesForPosts(
            postIds,
            currentUser.uid,
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
    [feedType, currentUser, lastDoc],
  );

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  useEffect(() => {
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedType, currentUser?.uid]);

  useEffect(() => {
    if (
      inView &&
      hasMore &&
      !isLoading &&
      !isLoadingMore &&
      !loadingRef.current &&
      posts.length > 0
    ) {
      loadPosts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, isLoading, isLoadingMore]);

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

    setPosts((prevPosts) => [optimisticPost, ...prevPosts]);

    try {
      const postId = await postsService.addPost(currentUser.uid, {
        content,
        bookClubId,
        upvoteCount: 0,
        downvoteCount: 0,
      });
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === tempId ? { ...post, id: postId } : post,
        ),
      );
    } catch (err: any) {
      console.error("Error creating post:", err);
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== tempId));
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
            {isLoadingMore && (
              <Loader className="animate-spin text-ns-accent" size={20} />
            )}
          </div>

          {!hasMore && posts.length > 0 && (
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
