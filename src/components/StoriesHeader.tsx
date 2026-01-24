import { Link } from "react-router-dom";
import { FaArrowRight, FaPlus } from "react-icons/fa";
import { IUser } from "@/types/IUser";
import { APP_NAME } from "@/config/seo";
import StoryMetadataModal from "@/routes/Story/StoryMetadataModal";

interface StoriesHeaderProps {
  user: IUser | null;
  onNewStory: () => void;
  isModalOpen: boolean;
  onCloseModal: () => void;
}

const StoriesHeader: React.FC<StoriesHeaderProps> = ({
  user,
  onNewStory,
  isModalOpen,
  onCloseModal,
}) => {
  if (user) {
    return (
      <div className="py-8 mb-8 border-b border-gray-200 dark:border-gray-700/50">
        <div className="flex items-start justify-between">
          {/* Welcome Section */}
          <div className="space-y-3">
            <h1 className="font-heading text-3xl font-semibold tracking-wide text-gray-900 dark:text-white">
              {user.displayName
                ? `Welcome back, ${user.displayName}`
                : "Welcome back"}
            </h1>
            <div className="w-12 h-0.5 bg-dark-green/30 dark:bg-light-green/30" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Discover and create amazing stories
            </p>
          </div>

          {/* New Story Button */}
          <button
            onClick={onNewStory}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-dark-green dark:border-light-green text-dark-green dark:text-light-green font-medium rounded-lg transition-all duration-200 hover:bg-dark-green hover:text-white dark:hover:bg-light-green dark:hover:text-white hover:shadow-md"
          >
            <FaPlus className="text-sm" />
            New Story
          </button>
        </div>

        {/* Story Metadata Modal */}
        <StoryMetadataModal
          isOpen={isModalOpen}
          onClose={onCloseModal}
          userId={user.uid}
        />
      </div>
    );
  }

  // Guest state
  return (
    <div className="py-12 mb-8 border-b border-gray-200 dark:border-gray-700/50">
      <div className="flex flex-col items-center text-center space-y-4">
        <h1 className="font-heading text-3xl font-semibold tracking-wide text-gray-900 dark:text-white">
          Welcome to {APP_NAME}
        </h1>
        <div className="w-16 h-0.5 bg-dark-green/30 dark:bg-light-green/30" />
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
          Discover stories from talented writers
        </p>
        <Link
          to="/sign-in"
          className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 border-2 border-dark-green dark:border-light-green text-dark-green dark:text-light-green font-medium rounded-lg transition-all duration-200 hover:bg-dark-green hover:text-white dark:hover:bg-light-green dark:hover:text-white hover:shadow-md"
        >
          Sign In
          <FaArrowRight className="text-sm" />
        </Link>
      </div>
    </div>
  );
};

export default StoriesHeader;
