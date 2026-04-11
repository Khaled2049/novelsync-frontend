import React from "react";
import { Home, TrendingUp, Book } from "lucide-react";

export type FeedType = "home" | "popular" | "book-clubs";

interface FeedNavigationProps {
  activeFeed: FeedType;
  onFeedChange: (feed: FeedType) => void;
}

const navItems = [
  { id: "home" as FeedType, label: "Home", icon: Home, symbol: "◆" },
  {
    id: "popular" as FeedType,
    label: "Popular",
    icon: TrendingUp,
    symbol: "↑",
  },
  {
    id: "book-clubs" as FeedType,
    label: "Book Clubs",
    icon: Book,
    symbol: "◎",
  },
];

const FeedNavigation: React.FC<FeedNavigationProps> = ({
  activeFeed,
  onFeedChange,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-ui text-xs tracking-widest uppercase text-ns-ink-muted whitespace-nowrap">
          Community
        </span>
        <div className="flex-1 h-px bg-ns-border" />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {navItems.map(({ id, label, symbol }) => {
          const isActive = activeFeed === id;
          return (
            <button
              key={id}
              onClick={() => onFeedChange(id)}
              className={`
                flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5
                rounded-full border text-xs font-ui font-medium tracking-wide
                transition-all duration-200
                ${
                  isActive
                    ? "bg-ns-accent border-ns-accent text-white shadow-ns-sm"
                    : "bg-ns-surface border-ns-border text-ns-ink-secondary hover:bg-ns-surface-hover hover:text-ns-ink hover:border-ns-border-strong"
                }
              `}
            >
              <span
                className={`text-[10px] leading-none ${isActive ? "opacity-80" : "opacity-50"}`}
                aria-hidden="true"
              >
                {symbol}
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FeedNavigation;
