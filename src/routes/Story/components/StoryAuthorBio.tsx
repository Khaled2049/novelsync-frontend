import React, { useState } from "react";
import { User, DollarSign } from "lucide-react";
import { StoryTipModal } from "./StoryTipModal";

interface StoryAuthorBioProps {
  author: string;
  bio?: string;
  authorWalletAddress?: string;
  storyId: string;
}

export const StoryAuthorBio: React.FC<StoryAuthorBioProps> = ({
  author,
  bio,
  authorWalletAddress,
  storyId,
}) => {
  const [showTipModal, setShowTipModal] = useState(false);

  const authorBio =
    bio ||
    `${author} is a writer who loves exploring complex themes through storytelling.`;

  const handleTipClick = () => {
    setShowTipModal(true);
  };

  return (
    <>
      <section className="mb-12">
        <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">
          About the Author
        </h3>
        <div className="flex gap-6 items-start">
          <div className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
            <User size={32} className="text-black/40 dark:text-white/40" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg text-black dark:text-white mb-2">
              {author}
            </h4>
            <p className="text-black/70 dark:text-white/70 leading-relaxed">
              {authorBio}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleTipClick}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white py-2.5 px-5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 transition-all duration-200 text-sm font-medium"
          >
            <DollarSign size={18} />
            Support this author
          </button>
        </div>
      </section>

      <StoryTipModal
        author={author}
        authorWalletAddress={
          authorWalletAddress || "0x0000000000000000000000000000000000000000"
        }
        storyId={storyId}
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
      />
    </>
  );
};
