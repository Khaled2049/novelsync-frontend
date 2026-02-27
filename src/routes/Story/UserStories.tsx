import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, BookOpen, Search } from "lucide-react";

import { useAuthContext } from "../../contexts/AuthContext";
import { storiesRepo } from "../../services/StoriesRepo";
import { StoryMetadata } from "@/types/IStory";
import { StoryRow } from "./components/StoryRow";
import { StoryEditModal } from "./components/StoryEditModal";
import { useEarnings } from "@/hooks/useEarnings";

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
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [editingStory, setEditingStory] = useState<StoryWithEarnings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published"
  >("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const navigate = useNavigate();

  const loadStories = useCallback(async () => {
    if (!user) return;
    try {
      const storyList = await storiesRepo.getUserStories(user.uid);
      const storiesWithEarnings = await Promise.all(
        storyList.map(async (story) => {
          const earnings = await fetchStoryEarnings(story.id);
          return { ...story, earnings };
        })
      );
      setStories(storiesWithEarnings);
    } catch (error) {
      console.error("Error loading stories:", error);
    }
  }, [user, fetchStoryEarnings]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setLoading(true);
        await loadStories();
        setLoading(false);
      }
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

  const handleSaveMetadata = async (
    storyId: string,
    data: { title: string; description: string; category?: string; tags?: string[] }
  ) => {
    await storiesRepo.updateStoryMetadata(storyId, data);
    await loadStories();
  };

  const handleImageUpdate = async (
    storyId: string,
    imageFile: File | null,
    previewUrl: string | null
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

  const filteredAndSortedStories = useMemo(() => {
    let filtered = stories.filter((story) => {
      const matchesSearch =
        searchQuery === "" ||
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" ? story.isPublished : !story.isPublished);
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "date-asc":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "views-desc":
          return (b.views || 0) - (a.views || 0);
        case "views-asc":
          return (a.views || 0) - (b.views || 0);
        case "likes-desc":
          return (b.likes || 0) - (a.likes || 0);
        case "likes-asc":
          return (a.likes || 0) - (b.likes || 0);
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [stories, searchQuery, statusFilter, sortBy]);

  const publishedCount = stories.filter((s) => s.isPublished).length;
  const draftCount = stories.filter((s) => !s.isPublished).length;
  const totalViews = stories.reduce((sum, s) => sum + (s.views || 0), 0);
  const totalEthEarnings = stories.reduce(
    (sum, s) => sum + parseFloat(s.earnings?.eth || "0"),
    0
  );
  const totalUsdcEarnings = stories.reduce(
    (sum, s) => sum + parseFloat(s.earnings?.usdc || "0"),
    0
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
              My Stories
            </h1>
            {!loading && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-sm font-ui text-ns-ink-secondary">
                <span>
                  {stories.length}{" "}
                  {stories.length === 1 ? "story" : "stories"}
                </span>
                {publishedCount > 0 && (
                  <>
                    <span className="w-px h-3.5 bg-ns-border inline-block" />
                    <span className="text-ns-accent">
                      {publishedCount} published
                    </span>
                  </>
                )}
                {draftCount > 0 && (
                  <>
                    <span className="w-px h-3.5 bg-ns-border inline-block" />
                    <span>
                      {draftCount} {draftCount === 1 ? "draft" : "drafts"}
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
            onClick={() => navigate("/create")}
            className="flex items-center gap-2 px-4 py-2.5 bg-ns-accent hover:bg-ns-accent-hover text-white text-sm font-ui font-medium rounded-ns transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Story
          </button>
        </div>

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

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ns-ink-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm font-ui bg-ns-surface border border-ns-border rounded-ns text-ns-ink placeholder-ns-ink-muted focus:outline-none focus:ring-1 focus:ring-ns-accent focus:border-ns-accent transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "draft" | "published")
            }
            className="px-3 py-2 text-sm font-ui bg-ns-surface border border-ns-border rounded-ns text-ns-ink focus:outline-none focus:ring-1 focus:ring-ns-accent cursor-pointer"
          >
            <option value="all">All status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm font-ui bg-ns-surface border border-ns-border rounded-ns text-ns-ink focus:outline-none focus:ring-1 focus:ring-ns-accent cursor-pointer"
          >
            <option value="date-desc">Recently updated</option>
            <option value="date-asc">Oldest first</option>
            <option value="views-desc">Most views</option>
            <option value="views-asc">Least views</option>
            <option value="likes-desc">Most liked</option>
            <option value="likes-asc">Least liked</option>
            <option value="title-asc">Title A–Z</option>
            <option value="title-desc">Title Z–A</option>
          </select>
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
        {!loading && filteredAndSortedStories.length === 0 && (
          <div className="py-24 text-center">
            {stories.length === 0 ? (
              <>
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
                  onClick={() => navigate("/create")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-ns-accent hover:bg-ns-accent-hover text-white text-sm font-ui font-medium rounded-ns transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Write a story
                </button>
              </>
            ) : (
              <>
                <p className="font-ui text-sm text-ns-ink-secondary">
                  No stories match your filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="mt-3 text-sm font-ui text-ns-accent hover:underline"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        )}

        {/* Story list */}
        {!loading && filteredAndSortedStories.length > 0 && (
          <div className="divide-y divide-ns-border">
            {filteredAndSortedStories.map((story) => (
              <StoryRow
                key={story.id}
                story={story}
                onEdit={editStory}
                onDelete={deleteStory}
                onUnpublish={unPublishStory}
                onEditDetails={(id) => setEditingStory(stories.find((s) => s.id === id) ?? null)}
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
    </>
  );
};

export default UserStories;
