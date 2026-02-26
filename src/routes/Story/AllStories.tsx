import { useAuthContext } from "../../contexts/AuthContext";
import { FaEye, FaThumbsUp, FaBook } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { storiesRepo } from "../../services/StoriesRepo";
import { StoryMetadata } from "@/types/IStory";
import { SEOHead } from "@/components/SEO/SEOHead";
import { APP_NAME } from "@/config/seo";
import StoriesHeader from "@/components/StoriesHeader";

const CATEGORIES = [
  { id: "all",               name: "All",         value: "all",               symbol: "◆" },
  { id: "fiction",           name: "Fiction",      value: "fiction",           symbol: "◗" },
  { id: "non-fiction",       name: "Non-Fiction",  value: "non-fiction",       symbol: "◎" },
  { id: "poetry",            name: "Poetry",       value: "poetry",            symbol: "❧" },
  { id: "fantasy",           name: "Fantasy",      value: "fantasy",           symbol: "✦" },
  { id: "science-fiction",   name: "Sci-Fi",       value: "science-fiction",   symbol: "⊙" },
  { id: "romance",           name: "Romance",      value: "romance",           symbol: "♡" },
  { id: "mystery-thriller",  name: "Mystery",      value: "mystery-thriller",  symbol: "◐" },
  { id: "horror",            name: "Horror",       value: "horror",            symbol: "◈" },
  { id: "historical-fiction",name: "Historical",   value: "historical-fiction",symbol: "⊕" },
  { id: "young-adult",       name: "Young Adult",  value: "young-adult",       symbol: "✶" },
  { id: "drama",             name: "Drama",        value: "drama",             symbol: "◉" },
  { id: "adventure",         name: "Adventure",    value: "adventure",         symbol: "▷" },
] as const;

const AllStories: React.FC = () => {
  const { user } = useAuthContext();

  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stories, setStories] = useState<StoryMetadata[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const storiesPerPage = 12;
  const indexOfLastNovel = currentPage * storiesPerPage;
  const indexOfFirstNovel = indexOfLastNovel - storiesPerPage;
  const currentStories = stories.slice(indexOfFirstNovel, indexOfLastNovel);
  const totalPages = Math.ceil(stories.length / storiesPerPage);

  const navigate = useNavigate();

  useEffect(() => {
    loadStories();
  }, [selectedCategory]);

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

  const loadStories = async () => {
    setLoading(true);
    try {
      let storyList: StoryMetadata[];
      if (selectedCategory === "all") {
        storyList = await storiesRepo.getPublishedStories();
      } else {
        storyList = await storiesRepo.getPublishedStoriesByCategory(selectedCategory);
      }
      setStories(storyList);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading stories:", error);
      setStories([]);
    } finally {
      setLoading(false);
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
        {/* Header */}
        <StoriesHeader
          user={user}
          onNewStory={handleNewStory}
          isModalOpen={isModalOpen}
          onCloseModal={() => setIsModalOpen(false)}
        />

        {/* Genre Strip */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-ui text-xs tracking-widest uppercase text-ns-ink-muted whitespace-nowrap">
              Browse by genre
            </span>
            <div className="flex-1 h-px bg-ns-border" />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category.value;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`
                    flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5
                    rounded-full border text-xs font-ui font-medium tracking-wide
                    transition-all duration-200
                    ${isActive
                      ? "bg-ns-accent border-ns-accent text-white shadow-ns-sm"
                      : "bg-ns-surface border-ns-border text-ns-ink-secondary hover:bg-ns-surface-hover hover:text-ns-ink hover:border-ns-border-strong"
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

        {/* Stories Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-ns-ink-muted font-ui text-sm">Loading stories…</span>
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
            {/* Story Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {currentStories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => handleStoryClick(story)}
                  className="group cursor-pointer"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-[2/3] rounded-ns overflow-hidden mb-2 bg-ns-surface">
                    {story.coverImageUrl ? (
                      <img
                        src={story.coverImageUrl}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaBook className="text-4xl text-ns-ink-muted opacity-30" />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100">
                      <div className="text-white text-xs space-y-2">
                        <p className="line-clamp-4 leading-relaxed font-body">
                          {story.description}
                        </p>
                        {story.tags && story.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {story.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="bg-ns-accent/80 text-white text-xs px-1.5 py-0.5 rounded font-ui"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-white text-xs flex items-center justify-between font-ui">
                        <span className="flex items-center gap-1">
                          <FaEye />
                          {story.views >= 1000
                            ? `${(story.views / 1000).toFixed(1)}K`
                            : story.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaThumbsUp /> {story.likes}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Story Info */}
                  <div className="space-y-0.5">
                    <h3 className="font-ui font-medium text-sm line-clamp-2 text-ns-ink group-hover:text-ns-accent transition-colors duration-200">
                      {story.title}
                    </h3>
                    <p className="text-xs text-ns-ink-muted font-ui">
                      {story.author}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
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
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AllStories;
