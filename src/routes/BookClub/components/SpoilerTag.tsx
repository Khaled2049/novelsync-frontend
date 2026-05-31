import React, { useState } from "react";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { ISpoilerTag } from "@/types/IClub";

interface SpoilerTagProps {
  spoiler: ISpoilerTag;
  userCurrentChapter?: number;
  className?: string;
}

const SpoilerTag: React.FC<SpoilerTagProps> = ({
  spoiler,
  userCurrentChapter,
  className = "",
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasWarned, setHasWarned] = useState(false);

  const isBeyondProgress =
    userCurrentChapter !== undefined &&
    userCurrentChapter < spoiler.chapterRange.start;

  const chapterRangeText =
    spoiler.chapterRange.end &&
    spoiler.chapterRange.end !== spoiler.chapterRange.start
      ? `Chapters ${spoiler.chapterRange.start}-${spoiler.chapterRange.end}`
      : `Chapter ${spoiler.chapterRange.start}`;

  const handleReveal = () => {
    if (!hasWarned && isBeyondProgress) {
      setHasWarned(true);
      return;
    }
    setIsRevealed(true);
  };

  if (isRevealed) {
    return (
      <div
        className={`inline-block p-2 bg-ns-surface border border-ns-border rounded-ns ${className}`}
      >
        <div className="flex items-start gap-2">
          <AlertTriangle
            size={16}
            className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5"
          />
          <div className="flex-1">
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-1 font-medium">
              Spoiler: {chapterRangeText}
            </p>
            <p className="text-sm text-ns-ink">{spoiler.content}</p>
          </div>
          <button
            onClick={() => setIsRevealed(false)}
            className="text-ns-ink-secondary hover:text-ns-ink"
            title="Hide spoiler"
          >
            <EyeOff size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (hasWarned && isBeyondProgress) {
    return (
      <div
        className={`inline-block p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded ${className}`}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={20}
            className="text-yellow-600 dark:text-yellow-400 shrink-0"
          />
          <div className="flex-1">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
              Warning: Spoiler Ahead!
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              This spoiler contains content from {chapterRangeText}. You are
              currently on Chapter {userCurrentChapter}. Revealing this may
              spoil your reading experience.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsRevealed(true)}
                className="px-3 py-1.5 bg-yellow-600 dark:bg-yellow-700 text-white rounded text-sm font-medium hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors"
              >
                Reveal Anyway
              </button>
              <button
                onClick={() => {
                  setHasWarned(false);
                  setIsRevealed(false);
                }}
                className="px-3 py-1.5 bg-ns-surface-hover text-ns-ink rounded-ns text-sm font-medium hover:bg-ns-elevated transition-colors"
              >
                Keep Hidden
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleReveal}
      className={`inline-flex items-center gap-2 px-3 py-2 bg-ns-surface-hover border border-ns-border rounded-ns hover:bg-ns-elevated transition-colors ${className}`}
    >
      <Eye size={16} className="text-ns-ink-secondary" />
      <span className="text-sm font-medium text-ns-ink">
        Spoiler: {chapterRangeText}
      </span>
      <span className="text-xs text-ns-ink-muted">(Click to reveal)</span>
    </button>
  );
};

export default SpoilerTag;
