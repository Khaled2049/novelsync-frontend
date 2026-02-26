import React, { useState } from "react";

interface StoryHeaderProps {
  title: string;
  author: string;
  rating?: number;
  genres?: string[];
  ratingsCount?: number;
  userRating?: number | null;
  onRatingSubmit?: (rating: number) => void;
  isAuthenticated?: boolean;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({
  title,
  author,
  rating,
  genres = ["Fiction", "Adventure", "Fantasy"],
  ratingsCount = 0,
  userRating = null,
  onRatingSubmit,
  isAuthenticated = false,
}) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const canRate = isAuthenticated && onRatingSubmit && userRating === null;
  const displayRating = userRating ?? rating ?? 0;
  const starsToShow = hoveredStar ?? displayRating;

  const handleStarClick = (starValue: number) => {
    if (canRate) {
      onRatingSubmit(starValue);
    }
  };

  const getRatingText = () => {
    if (ratingsCount === 0) return "No ratings yet";
    return `${ratingsCount} ${ratingsCount === 1 ? "rating" : "ratings"}`;
  };

  return (
    <div className="mb-8">
      <h1 className="font-heading italic text-5xl md:text-6xl text-ns-ink leading-[0.9] mb-4 tracking-tight">
        {title}
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <p className="font-ui text-sm text-ns-ink-secondary">
          <span className="text-ns-ink-muted mr-1.5">by</span>
          <span className="text-ns-ink">{author}</span>
        </p>

        {/* Star Rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= Math.round(starsToShow);
            return (
              <button
                key={star}
                className={`text-lg leading-none transition-all duration-100 ${
                  isFilled ? "text-ns-gold" : "text-ns-border"
                } ${canRate ? "cursor-pointer hover:scale-125" : "cursor-default"}`}
                onMouseEnter={() => canRate && setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(null)}
                onClick={() => handleStarClick(star)}
                disabled={!canRate}
              >
                ★
              </button>
            );
          })}
          <span className="ml-2 font-ui text-xs text-ns-ink-muted">
            {getRatingText()}
          </span>
        </div>
      </div>

      {/* Genres */}
      <div className="flex flex-wrap gap-2 mb-8">
        {genres.map((g) => (
          <span
            key={g}
            className="px-2.5 py-0.5 rounded-full border border-ns-border font-ui text-[10px] text-ns-ink-secondary uppercase tracking-widest"
          >
            {g}
          </span>
        ))}
      </div>
    </div>
  );
};
