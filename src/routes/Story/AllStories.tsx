import { useAuthContext } from "../../contexts/AuthContext";
import { FaEye, FaThumbsUp, FaBook } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { storiesRepo } from "../../services/StoriesRepo";
import { StoryMetadata } from "@/types/IStory";
import { SEOHead } from "@/components/SEO/SEOHead";
import { APP_NAME } from "@/config/seo";
import StoriesHeader from "@/components/StoriesHeader";

// Category definitions
const CATEGORIES = [
  { id: "all", name: "All Stories", value: "all" },
  { id: "fiction", name: "Fiction", value: "fiction" },
  { id: "non-fiction", name: "Non-Fiction", value: "non-fiction" },
  { id: "poetry", name: "Poetry", value: "poetry" },
  { id: "fantasy", name: "Fantasy", value: "fantasy" },
  { id: "science-fiction", name: "Science Fiction", value: "science-fiction" },
  { id: "romance", name: "Romance", value: "romance" },
  { id: "mystery-thriller", name: "Mystery/Thriller", value: "mystery-thriller" },
  { id: "horror", name: "Horror", value: "horror" },
  { id: "historical-fiction", name: "Historical Fiction", value: "historical-fiction" },
  { id: "young-adult", name: "Young Adult", value: "young-adult" },
  { id: "drama", name: "Drama", value: "drama" },
  { id: "adventure", name: "Adventure", value: "adventure" },
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
      setCurrentPage(1); // Reset to first page when category changes
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
      <div className="flex text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Categories Sidebar - Outside container, on the left */}
        <div className="hidden md:block w-64 flex-shrink-0 pl-4">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              Categories
            </h2>
            <ul className="space-y-1">
              {CATEGORIES.map((category) => (
                <li key={category.id}>
                  <button
                    onClick={() => setSelectedCategory(category.value)}
                    className={`w-full text-left px-4 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                      selectedCategory === category.value
                        ? "bg-dark-green dark:bg-light-green text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="text-sm">
                      {selectedCategory === category.value ? "•" : ""}
                    </span>
                    {category.name}
                    {selectedCategory === category.value && (
                      <span className="ml-auto text-sm opacity-70">→</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Content - Centered container */}
        <div className="flex-1 container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <StoriesHeader
            user={user}
            onNewStory={handleNewStory}
            isModalOpen={isModalOpen}
            onCloseModal={() => setIsModalOpen(false)}
          />

          {/* Stories Content - Directly under welcome message */}
          <div>
            {/* Mobile Category Selector */}
            <div className="md:hidden mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.value}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500 dark:text-gray-400">Loading stories...</div>
              </div>
            ) : currentStories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FaBook className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No stories found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedCategory === "all"
                    ? "No stories have been published yet."
                    : `No stories found in this category yet.`}
                </p>
              </div>
            ) : (
              <>
                {/* Story Grid  */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {currentStories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => handleStoryClick(story)}
                  className="group cursor-pointer"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 bg-gray-200 dark:bg-gray-800">
                    {story.coverImageUrl ? (
                      <img
                        src={story.coverImageUrl}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaBook className="text-4xl text-gray-400" />
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100">
                      <div className="text-white text-xs space-y-2">
                        <p className="line-clamp-4 leading-relaxed">
                          {story.description}
                        </p>
                        {story.tags && story.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {story.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="bg-dark-green/80 dark:bg-light-green/80 text-white text-xs px-1.5 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-white text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <FaEye />{" "}
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
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-dark-green dark:group-hover:text-light-green transition-colors">
                      {story.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {story.author}
                    </p>
                  </div>
                </div>
              ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNumber) => (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`w-8 h-8 rounded-lg transition-colors duration-200 ${
                            currentPage === pageNumber
                              ? "bg-dark-green dark:bg-light-green text-white"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AllStories;
