import React from "react";
import { Home, TrendingUp } from "lucide-react";
import { FeedType } from "./FeedNavigation";

interface MobileTabsProps {
  activeFeed: FeedType;
  onFeedChange: (feed: FeedType) => void;
}

const MobileTabs: React.FC<MobileTabsProps> = ({
  activeFeed,
  onFeedChange,
}) => {
  const navItems = [
    {
      id: "home" as FeedType,
      label: "Home",
      icon: Home,
    },
    {
      id: "popular" as FeedType,
      label: "Popular",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
      <div className="flex justify-center overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeFeed === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onFeedChange(item.id)}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1 px-3 py-3 min-w-0
                text-xs font-medium transition-colors duration-200 border-b-2
                ${
                  isActive
                    ? "border-dark-green dark:border-light-green text-dark-green dark:text-light-green"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }
              `}
            >
              <Icon size={18} />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTabs;
