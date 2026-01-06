import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthContext } from "../../contexts/AuthContext";
import { storiesRepo } from "../../services/StoriesRepo";
import { StoryMetadata } from "@/types/IStory";
import { StoryCard } from "./StoryCard";
import { StatisticsDashboard } from "./components/StatisticsDashboard";
import { SearchAndFilterBar } from "./components/SearchAndFilterBar";
import { StoryListView } from "./components/StoryListView";
import { StoryCardSkeleton } from "./components/StoryCardSkeleton";
import { Loader } from "lucide-react";
import { useEarnings } from "@/hooks/useEarnings";

interface StoryWithEarnings extends StoryMetadata {
  earnings: {
    eth: string;
    usdc: string;
  };
}

const UserStories = () => {
  const { user } = useAuthContext();
  const { fetchStoryEarnings } = useEarnings();
  const [stories, setStories] = useState<StoryWithEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published"
  >("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const navigate = useNavigate();

  const loadStories = useCallback(async () => {
    if (!user) return;
    try {
      const storyList = await storiesRepo.getUserStories(user?.uid);

      // Fetch earnings for each story
      const storiesWithEarnings = await Promise.all(
        storyList.map(async (story) => {
          const earnings = await fetchStoryEarnings(story.id);
          return {
            ...story,
            earnings,
          };
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

  const editStory = (storyId: string) => {
    navigate(`/create/${storyId}`);
  };

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

  // Filter and sort stories
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

    // Sort stories
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "date-asc":
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );
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

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-black text-black dark:text-white transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-6">
            {[...Array(3)].map((_, i) => (
              <StoryCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Statistics Dashboard */}
        <StatisticsDashboard stories={stories} />

        {/* Search and Filter Bar */}
        <SearchAndFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Stories Display */}
        {filteredAndSortedStories.length === 0 ? (
          <div className="text-center py-10 px-6 bg-white dark:bg-black rounded-lg shadow-sm border border-black/20 dark:border-white/20">
            <p className="text-black/70 dark:text-white/70">
              {searchQuery || statusFilter !== "all"
                ? "No stories match your filters."
                : "You have no stories yet."}
            </p>
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-lg shadow-sm overflow-hidden">
            <StoryListView
              stories={filteredAndSortedStories}
              onEdit={editStory}
              onDelete={deleteStory}
              onUnpublish={unPublishStory}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAndSortedStories.map((story) => (
              <div key={story.id} className="relative">
                {operationLoading === story.id && (
                  <div className="absolute inset-0 bg-black/50 dark:bg-white/10 rounded-xl flex items-center justify-center z-10">
                    <Loader className="w-6 h-6 animate-spin text-dark-green dark:text-light-green" />
                  </div>
                )}
                <StoryCard
                  story={story}
                  onEdit={editStory}
                  onDelete={deleteStory}
                  onUnpublish={unPublishStory}
                  isLoading={operationLoading === story.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserStories;
