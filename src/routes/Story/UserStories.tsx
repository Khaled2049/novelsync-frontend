import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, BookOpen, PenLine } from "lucide-react";

import { useAuthContext } from "../../contexts/AuthContext";
import { storiesRepo } from "../../services/StoriesRepo";
import { StoryMetadata } from "@/types/IStory";
import { StoryRow } from "./components/StoryRow";
import { StoryEditModal } from "./components/StoryEditModal";
import StoryMetadataModal from "./StoryMetadataModal";
import { useEarnings } from "@/hooks/useEarnings";
import { readingProgressService } from "@/services/ReadingProgressService";
import { IReadingProgress } from "@/types/IReadingProgress";

interface StoryWithEarnings extends StoryMetadata {
  earnings: {
    eth: string;
    usdc: string;
  };
}

const RowSkeleton = () => (
  <div className="flex gap-4 py-6 border-b border-ns-border animate-pulse">
    <div className="ml-4 w-12 h-[68px] bg-ns-surface rounded flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div className="h-5 w-52 bg-ns-surface rounded" />
        <div className="h-6 w-28 bg-ns-surface rounded flex-shrink-0" />
      </div>
      <div className="h-3 w-40 bg-ns-surface rounded mt-2" />
      <div className="h-3 w-full bg-ns-surface rounded mt-3" />
      <div className="flex gap-3 mt-3">
        <div className="h-3 w-12 bg-ns-surface rounded" />
        <div className="h-3 w-12 bg-ns-surface rounded" />
      </div>
    </div>
  </div>
);

const UserStories = () => {
  const { user } = useAuthContext();
  const { fetchStoryEarnings } = useEarnings();
  const [stories, setStories] = useState<StoryWithEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentlyRead, setRecentlyRead] = useState<IReadingProgress[]>([]);
  const [recentlyReadLoading, setRecentlyReadLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [editingStory, setEditingStory] = useState<StoryWithEarnings | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const loadStories = useCallback(async () => {
    if (!user) return;
    try {
      const storyList = await storiesRepo.getUserStories(user.uid);
      const storiesWithEarnings = await Promise.all(
        storyList.map(async (story) => {
          const earnings = await fetchStoryEarnings(story.id);
          return { ...story, earnings };
        }),
      );
      setStories(storiesWithEarnings);
    } catch (error) {
      console.error("Error loading stories:", error);
    }
  }, [user, fetchStoryEarnings]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      setRecentlyReadLoading(true);
      const [, recentItems] = await Promise.all([
        loadStories(),
        readingProgressService.getRecentlyRead(user.uid, 5),
      ]);
      setRecentlyRead(recentItems);
      setLoading(false);
      setRecentlyReadLoading(false);
    };
    fetchData();
  }, [user, loadStories]);

  const editStory = (storyId: string) => navigate(`/create/${storyId}`);

  const deleteStory = async (storyId: string) => {
    if (!user) return;
    setOperationLoading(storyId);
    try {
      await storiesRepo.deleteStory(storyId);
      await loadStories();
    } catch (error) {
      console.error("Error deleting story:", error);
    } finally {
      setOperationLoading(null);
    }
  };

  const unPublishStory = async (storyId: string) => {
    if (!user) return;
    setOperationLoading(storyId);
    try {
      await storiesRepo.handlePublish(storyId);
      await loadStories();
    } catch (error) {
      console.error("Error unpublishing story:", error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleClearReadingHistory = async () => {
    if (!user) return;
    await readingProgressService.clearAllProgress(user.uid);
    setRecentlyRead([]);
  };

  const handleSaveMetadata = async (
    storyId: string,
    data: {
      title: string;
      description: string;
      category?: string;
      tags?: string[];
    },
  ) => {
    await storiesRepo.updateStoryMetadata(storyId, data);
    await loadStories();
  };

  const handleImageUpdate = async (
    storyId: string,
    imageFile: File | null,
    previewUrl: string | null,
  ) => {
    if (!user) return;
    setOperationLoading(storyId);
    try {
      await storiesRepo.updateStoryCoverImage(storyId, imageFile, previewUrl);
      await loadStories();
    } catch (error) {
      console.error("Error updating cover image:", error);
    } finally {
      setOperationLoading(null);
    }
  };

  const sortedStories = useMemo(() => {
    return [...stories].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [stories]);

  const publishedCount = stories.filter((s) => s.isPublished).length;
  const draftCount = stories.filter((s) => !s.isPublished).length;
  const totalViews = stories.reduce((sum, s) => sum + (s.views || 0), 0);
  const totalEthEarnings = stories.reduce(
    (sum, s) => sum + parseFloat(s.earnings?.eth || "0"),
    0,
  );
  const totalUsdcEarnings = stories.reduce(
    (sum, s) => sum + parseFloat(s.earnings?.usdc || "0"),
    0,
  );
  const hasEarnings = totalEthEarnings > 0 || totalUsdcEarnings > 0;

  return (
    <>
      <div className="min-h-screen bg-ns-bg text-ns-ink transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Page header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="font-heading text-display text-ns-ink leading-none">
                My Shelf
              </h1>
              {!loading && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-sm font-ui text-ns-ink-secondary">
                  <span className="flex items-center gap-1.5">
                    <PenLine className="w-3.5 h-3.5" />
                    {stories.length}{" "}
                    {stories.length === 1 ? "story written" : "stories written"}
                  </span>
                  {!recentlyReadLoading && recentlyRead.length > 0 && (
                    <>
                      <span className="w-px h-3.5 bg-ns-border inline-block" />
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        {recentlyRead.length} in progress
                      </span>
                    </>
                  )}
                  {publishedCount > 0 && (
                    <>
                      <span className="w-px h-3.5 bg-ns-border inline-block" />
                      <span className="text-ns-accent">
                        {publishedCount} published
                      </span>
                    </>
                  )}
                  {totalViews > 0 && (
                    <>
                      <span className="w-px h-3.5 bg-ns-border inline-block" />
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {totalViews.toLocaleString()} views
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-ns-accent hover:bg-ns-accent-hover text-white text-sm font-ui font-medium rounded-ns transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              New Story
            </button>
          </div>

          {/* Continue Reading */}
          {!recentlyReadLoading && recentlyRead.length > 0 && (
            <section className="mb-12">
              <div className="flex items-baseline justify-between mb-5">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-heading italic text-3xl text-ns-ink">
                    Continue Reading
                  </h2>
                  <span className="font-ui text-xs text-ns-ink-muted">
                    {recentlyRead.length}{" "}
                    {recentlyRead.length === 1 ? "story" : "stories"} in
                    progress
                  </span>
                </div>
                <button
                  onClick={handleClearReadingHistory}
                  className="font-ui text-xs text-ns-ink-muted hover:text-ns-destructive transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentlyRead.map((item) => {
                  const progressPct =
                    item.totalChapters > 1
                      ? Math.round(
                          (item.chapterIndex / (item.totalChapters - 1)) * 100,
                        )
                      : 100;
                  return (
                    <div
                      key={item.storyId}
                      className="group flex gap-4 p-4 bg-ns-surface border border-ns-border rounded-ns-lg hover:border-ns-border-strong hover:shadow-ns transition-all duration-200 cursor-pointer"
                      onClick={() => navigate(`/story/${item.storyId}`)}
                    >
                      {/* Cover */}
                      <div className="flex-shrink-0 w-14 h-[80px] rounded overflow-hidden ring-1 ring-ns-border/50 shadow-sm">
                        {item.coverImageUrl ? (
                          <img
                            src={item.coverImageUrl}
                            alt={item.storyTitle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-ns-elevated flex items-center justify-center">
                            <span className="font-heading italic text-2xl text-ns-ink-muted opacity-30">
                              {item.storyTitle.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="font-ui text-sm font-semibold text-ns-ink truncate leading-snug">
                            {item.storyTitle}
                          </p>
                          <p className="font-ui text-xs text-ns-ink-secondary truncate mt-0.5">
                            {item.storyAuthor}
                          </p>
                        </div>

                        {/* Progress */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-ui text-[10px] text-ns-ink-muted">
                              Ch. {item.chapterIndex + 1} of{" "}
                              {item.totalChapters}
                            </span>
                            <span className="font-ui text-[10px] text-ns-ink-muted">
                              {progressPct}%
                            </span>
                          </div>
                          <div className="h-0.5 w-full bg-ns-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-ns-accent rounded-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/story/${item.storyId}`);
                          }}
                          className="mt-3 self-start inline-flex items-center gap-1.5 px-3 py-1 bg-ns-accent text-white font-ui text-xs font-medium rounded-ns hover:bg-ns-accent-hover transition-colors"
                        >
                          <BookOpen className="w-3 h-3" />
                          Continue
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Earnings strip */}
          {!loading && hasEarnings && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 mb-8 bg-ns-surface border border-ns-border rounded-ns-lg">
              <span className="text-xs font-ui font-semibold uppercase tracking-widest text-ns-ink-muted">
                Earnings
              </span>
              {totalEthEarnings > 0 && (
                <span className="text-sm font-ui font-medium text-emerald-600 dark:text-emerald-400">
                  {totalEthEarnings.toFixed(4)} ETH
                </span>
              )}
              {totalUsdcEarnings > 0 && (
                <span className="text-sm font-ui font-medium text-blue-600 dark:text-blue-400">
                  {totalUsdcEarnings.toFixed(2)} USDC
                </span>
              )}
            </div>
          )}

          {/* My Writing header */}
          <div className="flex items-baseline gap-3 mb-5">
            <h2 className="font-heading italic text-3xl text-ns-ink">
              My Writing
            </h2>
            {!loading && (
              <span className="font-ui text-xs text-ns-ink-muted">
                {stories.length} {stories.length === 1 ? "story" : "stories"}
                {draftCount > 0 &&
                  ` · ${draftCount} ${draftCount === 1 ? "draft" : "drafts"}`}
              </span>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="divide-y divide-ns-border">
              {[...Array(4)].map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && stories.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-ns-surface border border-ns-border flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-ns-ink-muted" />
              </div>
              <h2 className="font-heading text-2xl text-ns-ink mb-2">
                No stories yet
              </h2>
              <p className="font-ui text-sm text-ns-ink-secondary mb-6">
                Begin writing your first story.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-ns-accent hover:bg-ns-accent-hover text-white text-sm font-ui font-medium rounded-ns transition-colors"
              >
                <Plus className="w-4 h-4" />
                Write a story
              </button>
            </div>
          )}

          {/* Story list */}
          {!loading && sortedStories.length > 0 && (
            <div className="divide-y divide-ns-border">
              {sortedStories.map((story) => (
                <StoryRow
                  key={story.id}
                  story={story}
                  onEdit={editStory}
                  onDelete={deleteStory}
                  onUnpublish={unPublishStory}
                  onEditDetails={(id) =>
                    setEditingStory(stories.find((s) => s.id === id) ?? null)
                  }
                  onImageUpdate={handleImageUpdate}
                  isLoading={operationLoading === story.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {editingStory && (
        <StoryEditModal
          story={editingStory}
          onSave={handleSaveMetadata}
          onClose={() => setEditingStory(null)}
        />
      )}

      {user && (
        <StoryMetadataModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          userId={user.uid}
        />
      )}
    </>
  );
};

export default UserStories;
