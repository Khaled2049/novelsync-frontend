import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { storiesRepo } from "../../services/StoriesRepo";
import { Chapter, Story } from "@/types/IStory";
import { CommentService } from "@/services/CommentService";
import { Comment as IComment } from "@/types/IComment";
import { useAuthContext } from "@/contexts/AuthContext";
import { onSnapshot, orderBy, query } from "firebase/firestore";
import { StoryLoadingState } from "./components/StoryLoadingState";
import { StoryErrorState } from "./components/StoryErrorState";
import { StorySynopsis } from "./components/StorySynopsis";
import { BookOpen, Heart } from "lucide-react";
import { StoryAuthorBio } from "./components/StoryAuthorBio";
import { StoryCommentsSection } from "./components/StoryCommentsSection";
import { ChapterReader } from "./components/reader/ChapterReader";
import { useUserWalletAddress } from "@/hooks/useUserWalletAddress";
import { SEOHead } from "@/components/SEO/SEOHead";
import { getAbsoluteUrl } from "@/config/seo";

interface StoryDetailState {
  story: Story | null;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  currentChapterIndex: number;
  likes: number;
  comments: IComment[];
  loading: boolean;
  commentsLoading: boolean;
  error: string | null;
  isLiked: boolean;
  userRating: number | null;
  ratingsCount: number;
}

type ViewMode = "details" | "reader";

const StoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const commentService = useMemo(() => new CommentService(), []);

  const [viewMode, setViewMode] = useState<ViewMode>("details");
  const [hoveredHeroStar, setHoveredHeroStar] = useState<number | null>(null);

  const [state, setState] = useState<StoryDetailState>({
    story: null,
    chapters: [],
    currentChapter: null,
    currentChapterIndex: 0,
    likes: 0,
    comments: [],
    loading: true,
    commentsLoading: true,
    error: null,
    isLiked: false,
    userRating: null,
    ratingsCount: 0,
  });

  const { walletAddress: authorWalletAddress } = useUserWalletAddress(
    state.story?.userId
  );

  // --- Data Loading ---
  const loadStory = useCallback(
    async (storyId: string, chapterIndex: number = 0) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const [storyData, chaptersData] = await Promise.all([
          storiesRepo.getStory(storyId),
          storiesRepo.getChapters(storyId),
        ]);

        if (!storyData) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: "Story not found",
          }));
          return;
        }

        const validChapterIndex = Math.max(
          0,
          Math.min(chapterIndex, chaptersData.length - 1)
        );
        const currentChapter = chaptersData[validChapterIndex] || null;

        let isLiked = false;
        let userRating: number | null = null;
        if (user) {
          isLiked = await storiesRepo.hasUserLikedStory(storyId, user.uid);
          userRating = await storiesRepo.getUserRating(storyId, user.uid);
        }

        setState((prev) => ({
          ...prev,
          story: storyData,
          chapters: chaptersData,
          currentChapter,
          currentChapterIndex: validChapterIndex,
          likes: storyData.likes || 0,
          isLiked,
          userRating,
          ratingsCount: storyData.ratingsCount || 0,
          loading: false,
        }));
      } catch (error) {
        console.error("Error fetching story:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load story",
        }));
      }
    },
    [user]
  );

  // --- Handlers ---
  const handleLike = useCallback(async () => {
    if (!id || !user) return;

    const previousIsLiked = state.isLiked;
    const previousLikes = state.likes;

    setState((prev) => ({
      ...prev,
      isLiked: !prev.isLiked,
      likes: prev.isLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1,
    }));

    try {
      const isLiked = await storiesRepo.toggleStoryLike(id, user.uid);
      setState((prev) => ({
        ...prev,
        isLiked,
        likes: isLiked ? previousLikes + 1 : Math.max(0, previousLikes - 1),
      }));
    } catch (error) {
      console.error("Error toggling like:", error);
      setState((prev) => ({
        ...prev,
        isLiked: previousIsLiked,
        likes: previousLikes,
      }));
    }
  }, [id, user, state.isLiked, state.likes]);

  const handleRatingSubmit = useCallback(
    async (rating: number) => {
      if (!id || !user) return;
      if (state.userRating !== null) return;

      const previousUserRating = state.userRating;
      const previousRatingsCount = state.ratingsCount;
      const previousAverageRating = state.story?.averageRating;

      setState((prev) => ({
        ...prev,
        userRating: rating,
        ratingsCount: prev.ratingsCount + 1,
      }));

      try {
        await storiesRepo.submitStoryRating(id, user.uid, rating);
        const updatedStory = await storiesRepo.getStory(id);
        if (updatedStory) {
          setState((prev) => ({
            ...prev,
            story: updatedStory,
            ratingsCount: updatedStory.ratingsCount || 0,
          }));
        }
      } catch (error) {
        console.error("Error submitting rating:", error);
        setState((prev) => ({
          ...prev,
          userRating: previousUserRating,
          ratingsCount: previousRatingsCount,
          story: prev.story
            ? { ...prev.story, averageRating: previousAverageRating }
            : null,
        }));
      }
    },
    [id, user, state.userRating, state.ratingsCount, state.story]
  );

  const handlePrevChapter = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentChapterIndex: Math.max(prev.currentChapterIndex - 1, 0),
      currentChapter:
        prev.chapters[Math.max(prev.currentChapterIndex - 1, 0)] || null,
    }));
    window.scrollTo(0, 0);
  }, []);

  const handleNextChapter = useCallback(() => {
    setState((prev) => {
      const nextIndex = Math.min(
        prev.currentChapterIndex + 1,
        prev.chapters.length - 1
      );
      return {
        ...prev,
        currentChapterIndex: nextIndex,
        currentChapter: prev.chapters[nextIndex] || null,
      };
    });
    window.scrollTo(0, 0);
  }, []);

  // --- Comment Logic ---
  const handleCommentLike = useCallback(
    async (commentId: string) => {
      if (!user || !id || !state.currentChapter) return;
      try {
        await commentService.addLike(
          id,
          state.currentChapter.id,
          commentId,
          user.uid
        );
      } catch (error) {
        console.error("Error toggling like:", error);
      }
    },
    [user, id, state.currentChapter, commentService]
  );

  const handleReply = useCallback(
    async (parentId: string, message: string) => {
      if (!user || !id || !state.currentChapter) return;
      try {
        await commentService.addComment(
          id,
          state.currentChapter.id,
          user.uid,
          user.username,
          message,
          parentId
        );
      } catch (error) {
        console.error("Error adding reply:", error);
      }
    },
    [user, id, state.currentChapter, commentService]
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!id || !state.currentChapter) return;
      try {
        await commentService.deleteComment(
          id,
          state.currentChapter.id,
          commentId
        );
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    },
    [id, state.currentChapter, commentService]
  );

  const handleEdit = useCallback(
    async (commentId: string, newMessage: string) => {
      if (!id || !state.currentChapter) return;
      try {
        await commentService.updateComment(
          id,
          state.currentChapter.id,
          commentId,
          newMessage
        );
      } catch (error) {
        console.error("Error updating comment:", error);
      }
    },
    [id, state.currentChapter, commentService]
  );

  // --- Effects ---
  useEffect(() => {
    if (id) {
      loadStory(id, state.currentChapterIndex);
    }
  }, [id, loadStory]);

  useEffect(() => {
    if (!id || !state.currentChapter) {
      setState((prev) => ({ ...prev, comments: [], commentsLoading: false }));
      return;
    }

    setState((prev) => ({ ...prev, commentsLoading: true }));
    const commentsCollection = commentService.getCommentsCollection(
      id,
      state.currentChapter.id
    );
    const q = query(commentsCollection, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updatedComments = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            storyId: id,
            chapterId: state.currentChapter!.id,
            message: data.message,
            userId: data.userId,
            parentId: data.parentId || null,
            likes: data.likes || [],
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            username: data.username,
          };
        });

        setState((prev) => ({
          ...prev,
          comments: updatedComments,
          commentsLoading: false,
        }));
      },
      (error) => {
        console.error("Error listening to comments:", error);
        setState((prev) => ({ ...prev, commentsLoading: false }));
      }
    );

    return () => unsubscribe();
  }, [id, state.currentChapter, commentService]);

  // --- Render ---
  if (state.loading) {
    return <StoryLoadingState />;
  }

  if (state.error || !state.story) {
    return (
      <StoryErrorState
        error={state.error}
        onRetry={() => id && loadStory(id)}
      />
    );
  }

  // --- VIEW 1: DETAILS ---
  if (viewMode === "details") {
    const genres = state.story.tags || ["Fiction", "Adventure", "Fantasy"];
    const storyUrl = `/story/${state.story.id}`;
    const storyImage = state.story.coverImageUrl
      ? getAbsoluteUrl(state.story.coverImageUrl)
      : getAbsoluteUrl("/book.svg");

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Book",
      name: state.story.title,
      description: state.story.description,
      author: {
        "@type": "Person",
        name: state.story.author,
      },
      image: storyImage,
      url: getAbsoluteUrl(storyUrl),
      datePublished: state.story.createdAt.toISOString(),
      dateModified: state.story.updatedAt.toISOString(),
      aggregateRating: state.story.averageRating
        ? {
            "@type": "AggregateRating",
            ratingValue: state.story.averageRating,
            ratingCount: state.ratingsCount || 0,
          }
        : undefined,
      keywords: genres.join(", "),
      numberOfPages: state.chapters.length,
    };

    const canRate = !!user && state.userRating === null;
    const displayRating = state.userRating ?? state.story.averageRating ?? 0;
    const starsToShow = hoveredHeroStar ?? displayRating;

    return (
      <>
        <SEOHead
          title={state.story.title}
          description={state.story.description}
          keywords={genres}
          image={state.story.coverImageUrl}
          url={storyUrl}
          type="article"
          author={state.story.author}
          publishedTime={state.story.createdAt.toISOString()}
          modifiedTime={state.story.updatedAt.toISOString()}
          canonical={storyUrl}
          structuredData={structuredData}
        />

        <div className="min-h-screen bg-ns-bg font-body">

          {/* ── Header: cover + title side by side ── */}
          <div className="max-w-5xl mx-auto px-6 pt-28 pb-10 border-b border-ns-border">
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-10 items-start">

              {/* Book cover */}
              <div className="flex-shrink-0 w-36 sm:w-44 aspect-[2/3] rounded-ns-lg shadow-ns-xl overflow-hidden ring-1 ring-ns-border/40 self-start">
                {state.story.coverImageUrl ? (
                  <img
                    src={state.story.coverImageUrl}
                    alt={state.story.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-ns-elevated flex items-center justify-center">
                    <span className="font-heading italic text-3xl text-ns-ink-muted opacity-40">
                      {state.story.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Title block */}
              <div className="flex-1 min-w-0 pt-1">
                {/* Genre pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {genres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-0.5 rounded-full border border-ns-border font-ui text-[10px] uppercase tracking-widest text-ns-ink-muted"
                    >
                      {g}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h1 className="font-heading italic text-5xl sm:text-6xl md:text-7xl text-ns-ink leading-[0.88] mb-5 tracking-tight">
                  {state.story.title}
                </h1>

                {/* Author + stats */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-6">
                  <span className="font-ui text-xs text-ns-ink-muted">by</span>
                  <span className="font-ui text-sm text-ns-ink">
                    {state.story.author}
                  </span>
                  <span className="text-ns-border select-none">·</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => canRate && handleRatingSubmit(star)}
                        onMouseEnter={() => canRate && setHoveredHeroStar(star)}
                        onMouseLeave={() => setHoveredHeroStar(null)}
                        disabled={!canRate}
                        className={`text-base leading-none transition-all duration-100 ${
                          star <= Math.round(starsToShow)
                            ? "text-ns-gold"
                            : "text-ns-border"
                        } ${canRate ? "cursor-pointer hover:scale-125" : "cursor-default"}`}
                        aria-label={`Rate ${star} stars`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span className="font-ui text-xs text-ns-ink-muted">
                    {state.ratingsCount > 0
                      ? `${state.ratingsCount} ${state.ratingsCount === 1 ? "rating" : "ratings"}`
                      : "No ratings yet"}
                  </span>
                  <span className="text-ns-border select-none">·</span>
                  <span className="font-ui text-xs text-ns-ink-muted">
                    {state.chapters.length}{" "}
                    {state.chapters.length === 1 ? "chapter" : "chapters"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setViewMode("reader")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-ns-accent text-white font-ui text-sm font-medium rounded-ns shadow-ns-sm hover:bg-ns-accent-hover active:scale-[0.97] transition-all duration-150"
                  >
                    <BookOpen className="w-4 h-4" />
                    Read Now
                  </button>
                  <button
                    onClick={handleLike}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-ns border font-ui text-sm transition-all duration-150 active:scale-[0.97] ${
                      state.isLiked
                        ? "border-ns-accent text-ns-accent bg-ns-accent-subtle"
                        : "border-ns-border text-ns-ink-secondary hover:border-ns-border-strong hover:text-ns-ink hover:bg-ns-surface-hover"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 transition-all ${state.isLiked ? "fill-current" : ""}`}
                    />
                    {state.likes} {state.likes === 1 ? "Like" : "Likes"}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ── Content ── */}
          <div className="max-w-5xl mx-auto px-6 py-12">
            <main className="max-w-2xl mx-auto">
                <StorySynopsis description={state.story.description} />

                {/* Ornamental divider */}
                <div className="flex items-center gap-4 my-10">
                  <div className="flex-1 h-px bg-ns-border" />
                  <span className="text-ns-ink-muted text-xs select-none">✦</span>
                  <div className="flex-1 h-px bg-ns-border" />
                </div>

                <StoryAuthorBio
                  author={state.story.author}
                  authorWalletAddress={authorWalletAddress || undefined}
                  storyId={id!}
                />

                <div className="flex items-center gap-4 my-10">
                  <div className="flex-1 h-px bg-ns-border" />
                  <span className="text-ns-ink-muted text-xs select-none">✦</span>
                  <div className="flex-1 h-px bg-ns-border" />
                </div>

                {state.currentChapter && (
                  <StoryCommentsSection
                    storyId={id!}
                    chapterId={state.currentChapter.id}
                    comments={state.comments}
                    commentsLoading={state.commentsLoading}
                    currentUser={user}
                    onLike={handleCommentLike}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                )}
            </main>
          </div>

        </div>
      </>
    );
  }

  // --- VIEW 2: READER ---
  if (!state.currentChapter) {
    return <StoryErrorState error="No chapter available" onRetry={() => {}} />;
  }

  return (
    <ChapterReader
      currentChapter={state.currentChapter}
      currentChapterIndex={state.currentChapterIndex}
      totalChapters={state.chapters.length}
      onBackToDetails={() => setViewMode("details")}
      onPrevChapter={handlePrevChapter}
      onNextChapter={handleNextChapter}
    />
  );
};

export default StoryDetail;
