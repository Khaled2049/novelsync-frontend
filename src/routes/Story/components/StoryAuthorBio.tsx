import React, { useState } from "react";
import { User, DollarSign } from "lucide-react";
import { StoryTipModal } from "./StoryTipModal";
import { WEB3_ENABLED } from "@/config/featureFlags";

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

  return (
    <>
      <section className="mb-10">
        <p className="font-ui text-[10px] font-semibold text-ns-ink-muted uppercase tracking-widest mb-5">
          About the Author
        </p>

        <div className="flex gap-5 items-start">
          <div className="w-14 h-14 rounded-full bg-ns-elevated border border-ns-border flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-ns-ink-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-ui text-sm font-semibold text-ns-ink mb-1.5">
              {author}
            </h4>
            <p className="font-body text-sm text-ns-ink-secondary leading-relaxed">
              {authorBio}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={WEB3_ENABLED ? () => setShowTipModal(true) : undefined}
            disabled={!WEB3_ENABLED}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ns border border-ns-border font-ui text-xs text-ns-ink-secondary transition-all duration-150 ${
              WEB3_ENABLED
                ? "hover:bg-ns-surface hover:text-ns-ink active:scale-[0.97]"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Support this author
          </button>
          {!WEB3_ENABLED && (
            <span className="inline-block px-2 py-0.5 rounded-full bg-ns-accent-subtle font-ui text-[10px] font-semibold text-ns-accent tracking-wide uppercase">
              Coming soon
            </span>
          )}
        </div>
      </section>

      {WEB3_ENABLED && (
        <StoryTipModal
          author={author}
          authorWalletAddress={
            authorWalletAddress || "0x0000000000000000000000000000000000000000"
          }
          storyId={storyId}
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
        />
      )}
    </>
  );
};
