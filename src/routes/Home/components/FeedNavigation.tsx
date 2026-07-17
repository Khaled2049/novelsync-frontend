import React from "react";

export type FeedType = "home" | "popular";

interface FeedNavigationProps {
  activeFeed: FeedType;
  onFeedChange: (feed: FeedType) => void;
}

const navItems = [
  { id: "home" as FeedType, label: "Home" },
  { id: "popular" as FeedType, label: "Popular" },
];

const FeedNavigation: React.FC<FeedNavigationProps> = ({
  activeFeed,
  onFeedChange,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 h-9 mb-5">
      <span className="font-ui text-[11px] tracking-[1.5px] uppercase text-ns-ink-muted whitespace-nowrap">
        Community
      </span>

      <div className="flex gap-2.5">
        {navItems.map(({ id, label }) => {
          const isActive = activeFeed === id;
          return (
            <button
              key={id}
              onClick={() => onFeedChange(id)}
              className={`
                px-[18px] py-2 rounded-full font-ui text-sm
                transition-colors duration-200
                ${
                  isActive
                    ? "bg-ns-accent text-white font-semibold"
                    : "bg-ns-surface-hover text-ns-ink-secondary hover:text-ns-ink"
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FeedNavigation;
