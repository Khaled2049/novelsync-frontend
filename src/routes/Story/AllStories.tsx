import { useAuthContext } from "../../contexts/AuthContext";
import { FaEye, FaThumbsUp, FaBook } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { storiesRepo } from "../../services/StoriesRepo";
import { SEOHead } from "@/components/seo/SEOHead";
import { APP_NAME } from "@/config/seo";
import StoriesHeader from "@/components/story/StoriesHeader";
import { StoryMetadata } from "@/types/IStory";
import { usePublishedStories } from "@/hooks/queries/useStoryQueries";

const CATEGORIES = [
  { id: "all", name: "All", value: "all", symbol: "◆" },
  { id: "fiction", name: "Fiction", value: "fiction", symbol: "◗" },
  { id: "non-fiction", name: "Non-Fiction", value: "non-fiction", symbol: "◎" },
  { id: "poetry", name: "Poetry", value: "poetry", symbol: "❧" },
  { id: "fantasy", name: "Fantasy", value: "fantasy", symbol: "✦" },
  {
    id: "science-fiction",
    name: "Sci-Fi",
    value: "science-fiction",
    symbol: "⊙",
  },
  { id: "romance", name: "Romance", value: "romance", symbol: "♡" },
  {
    id: "mystery-thriller",
    name: "Mystery",
    value: "mystery-thriller",
    symbol: "◐",
  },
  { id: "horror", name: "Horror", value: "horror", symbol: "◈" },
  {
    id: "historical-fiction",
    name: "Historical",
    value: "historical-fiction",
    symbol: "⊕",
  },
  { id: "young-adult", name: "Young Adult", value: "young-adult", symbol: "✶" },
] as const;

const StoryCover: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <FaBook className="text-4xl text-ns-ink-muted opacity-30" />
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 bg-ns-surface animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
};

const AllStories: React.FC = () => {
  const { user } = useAuthContext();

  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const {
    data: stories = [],
    isLoading: loading,
    isError,
    error,
  } = usePublishedStories(selectedCategory);

  const storiesPerPage = 24;
  const indexOfLastNovel = currentPage * storiesPerPage;
  const indexOfFirstNovel = indexOfLastNovel - storiesPerPage;
  const currentStories = stories.slice(indexOfFirstNovel, indexOfLastNovel);
  const totalPages = Math.ceil(stories.length / storiesPerPage);

  const navigate = useNavigate();

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleNewStory = () => {
    if (user) {
      setIsModalOpen(true);
    } else {
      console.error("User not authenticated");
    }
  };

  const handleStoryClick = async (story: StoryMetadata) => {
    const storyData = await storiesRepo.getStory(story.id);
    if (storyData) {
      storiesRepo.incrementViewCount(story.id);
      navigate(`/story/${story.id}`);
    }
  };

  return (
    <>
      <SEOHead
        title={`Discover Stories - ${APP_NAME}`}
        description={`Browse and discover amazing stories from talented writers. Explore fiction, fantasy, romance, sci-fi, and more. Join the ${APP_NAME} community and start reading today.`}
        keywords={[
          "stories",
          "fiction",
          "novels",
          "reading",
          "books",
          "literature",
          "story discovery",
        ]}
        url="/stories"
        canonical="/stories"
      />

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex gap-8 items-start border-t border-ns-border pt-4">
          {/* Left: header + mobile strip + grid */}
          <div className="flex-1 min-w-0 border-r border-ns-border pr-8">
            <StoriesHeader
              user={user}
              onNewStory={handleNewStory}
              isModalOpen={isModalOpen}
              onCloseModal={() => setIsModalOpen(false)}
            />

            {/* Mobile genre strip */}
            <div className="lg:hidden mb-6">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {CATEGORIES.map((category) => {
                  const isActive = selectedCategory === category.value;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.value)}
                      className={`
                        flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5
                        rounded-full border text-xs font-ui font-medium tracking-wide
                        transition-all duration-200
                        ${
                          isActive
                            ? "bg-ns-accent border-ns-accent text-white shadow-ns-sm"
                            : "bg-ns-surface border-ns-border text-ns-ink-secondary hover:bg-ns-surface-hover hover:text-ns-ink"
                        }
                      `}
                    >
                      <span
                        className={`text-[10px] leading-none ${isActive ? "opacity-80" : "opacity-50"}`}
                        aria-hidden="true"
                      >
                        {category.symbol}
                      </span>
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Story grid */}
            {isError && (
              <div className="mb-6 px-4 py-3 rounded-ns border border-ns-destructive/20 bg-ns-accent-subtle text-ns-destructive font-ui text-sm">
                {error instanceof Error
                  ? error.message
                  : "Failed to load stories. Please try again."}
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <span className="text-ns-ink-muted font-ui text-sm">
                  Loading stories…
                </span>
              </div>
            ) : currentStories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FaBook className="text-5xl text-ns-ink-muted mb-4 opacity-30" />
                <h3 className="font-heading text-title font-medium text-ns-ink mb-2">
                  No stories found
                </h3>
                <p className="text-ns-ink-secondary font-ui text-sm">
                  {selectedCategory === "all"
                    ? "No stories have been published yet."
                    : "No stories found in this category yet."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2">
                  {currentStories.map((story) => (
                    <div
                      key={story.id}
                      onClick={() => handleStoryClick(story)}
                      className="group cursor-pointer"
                    >
                      <div className="max-w-[130px] mx-auto">
                        <div className="relative aspect-[2/3] rounded-ns overflow-hidden mb-2 bg-ns-surface">
                          <StoryCover
                            src={story.coverImageUrl}
                            alt={story.title}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100">
                            <p className="text-white text-[10px] line-clamp-3 leading-relaxed font-body">
                              {story.description}
                            </p>
                            <div className="text-white text-[10px] flex items-center justify-between font-ui">
                              <span className="flex items-center gap-0.5">
                                <FaEye />
                                {story.views >= 1000
                                  ? `${(story.views / 1000).toFixed(1)}K`
                                  : story.views}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <FaThumbsUp /> {story.likes}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h3
                          title={story.title}
                          className="font-ui font-medium text-sm truncate text-ns-ink group-hover:text-ns-accent transition-colors duration-200"
                        >
                          {story.title}
                        </h3>
                        <p
                          title={story.author}
                          className="text-xs text-ns-ink-muted font-ui truncate"
                        >
                          {story.author}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNumber) => (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`w-8 h-8 rounded-ns font-ui text-sm transition-all duration-200 ${
                            currentPage === pageNumber
                              ? "bg-ns-accent text-white shadow-ns-sm"
                              : "text-ns-ink-secondary hover:bg-ns-surface hover:text-ns-ink"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: genre sidebar — desktop only */}
          <aside className="hidden lg:block w-40 shrink-0 sticky top-20 self-start pt-8">
            <div className="mb-4">
              <span className="font-ui text-[10px] tracking-[0.2em] uppercase text-ns-ink-muted">
                Genres
              </span>
              <div className="mt-2 h-px bg-ns-border" />
            </div>
            <nav className="flex flex-col">
              {CATEGORIES.map((category) => {
                const isActive = selectedCategory === category.value;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`
                      group flex items-center gap-2.5 px-3 py-2 text-left
                      border-l-2 transition-all duration-200 text-sm font-ui
                      ${
                        isActive
                          ? "border-ns-accent text-ns-accent bg-ns-accent/5 font-medium"
                          : "border-transparent text-ns-ink-secondary hover:border-ns-border-strong hover:text-ns-ink hover:bg-ns-surface"
                      }
                    `}
                  >
                    <span
                      className={`text-[11px] leading-none w-3 text-center shrink-0 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-40 group-hover:opacity-70"}`}
                      aria-hidden="true"
                    >
                      {category.symbol}
                    </span>
                    {category.name}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      </div>
    </>
  );
};

export default AllStories;
