import { useAuthContext } from "../../contexts/AuthContext";
import { FaArrowRight, FaEye, FaThumbsUp, FaBook } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { storiesRepo } from "../../services/StoriesRepo";
import StoryMetadataModal from "./StoryMetadataModal";
import { StoryMetadata } from "@/types/IStory";
import { SEOHead } from "@/components/SEO/SEOHead";

const AllStories: React.FC = () => {
  const { user } = useAuthContext();

  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stories, setStories] = useState<StoryMetadata[]>([]);
  const storiesPerPage = 12;
  const indexOfLastNovel = currentPage * storiesPerPage;
  const indexOfFirstNovel = indexOfLastNovel - storiesPerPage;
  const currentStories = stories.slice(indexOfFirstNovel, indexOfLastNovel);
  const totalPages = Math.ceil(stories.length / storiesPerPage);

  const navigate = useNavigate();

  useEffect(() => {
    loadStories();
  }, []);

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
    const storyList = await storiesRepo.getPublishedStories();
    setStories(storyList);
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
        title="Discover Stories - NovelSync"
        description="Browse and discover amazing stories from talented writers. Explore fiction, fantasy, romance, sci-fi, and more. Join the NovelSync community and start reading today."
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
      <div className="text-gray-900 dark:text-gray-100 transition-colors duration-300 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        {user ? (
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.displayName
                ? `Welcome back, ${user.displayName}!`
                : "Welcome Back!"}
            </h1>
            <button
              onClick={handleNewStory}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center gap-2"
            >
              <FaBook className="text-sm" />
              New Story
            </button>

            {/* Story Metadata Modal */}
            <StoryMetadataModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              userId={user.uid}
            />
          </div>
        ) : (
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Welcome to NovelSync!</h1>
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Sign In
              <FaArrowRight />
            </Link>
          </div>
        )}

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-4">Stories</h2>

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
                                className="bg-orange-500/80 text-white text-xs px-1.5 py-0.5 rounded"
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
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
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
                          ? "bg-orange-500 text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AllStories;
