import React from "react";
import { Home, TrendingUp, Book } from "lucide-react";

export type FeedType = "home" | "popular" | "book-clubs";

interface FeedNavigationProps {
  activeFeed: FeedType;
  onFeedChange: (feed: FeedType) => void;
}

const FeedNavigation: React.FC<FeedNavigationProps> = ({
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
    {
      id: "book-clubs" as FeedType,
      label: "Book Clubs",
      icon: Book,
    },
  ];

  return (
    <div className="hidden md:block mb-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2">
        <nav>
          <ul className="flex items-center justify-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeFeed === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => onFeedChange(item.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg
                      text-sm font-medium transition-colors duration-200
                      ${
                        isActive
                          ? "bg-dark-green dark:bg-light-green text-white dark:text-black"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default FeedNavigation;
