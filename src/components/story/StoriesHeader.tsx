import { IUser } from "@/types/IUser";

import StoryMetadataModal from "@/routes/Story/StoryMetadataModal";

interface StoriesHeaderProps {
  user: IUser | null;
  onNewStory: () => void;
  isModalOpen: boolean;
  onCloseModal: () => void;
}

const StoriesHeader: React.FC<StoriesHeaderProps> = ({
  user,
  // onNewStory,
  isModalOpen,
  onCloseModal,
}) => {
  if (user) {
    return (
      <div className="py-8 mb-2">
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
          {/* <button
            onClick={onNewStory}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-dark-green dark:border-light-green text-dark-green dark:text-light-green font-medium rounded-lg transition-all duration-200 hover:bg-dark-green hover:text-white dark:hover:bg-light-green dark:hover:text-white hover:shadow-md"
          >
            <FaPlus className="text-sm" />
            New Story
          </button> */}
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
};

export default StoriesHeader;
