import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, TrendingUp, Compass, Book } from "lucide-react";

export type FeedType = "home" | "popular" | "explore" | "book-clubs";

interface NavigationSidebarProps {
  activeFeed: FeedType;
  onFeedChange: (feed: FeedType) => void;
  isCollapsed: boolean;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeFeed,
  onFeedChange,
  isCollapsed,
}) => {
  const navigate = useNavigate();

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
      id: "explore" as FeedType,
      label: "Explore",
      icon: Compass,
      isNavigation: true, // Flag to indicate this should navigate instead of changing feed
    },
    {
      id: "book-clubs" as FeedType,
      label: "Book Clubs",
      icon: Book,
    },
  ];

  return (
    <div
      className={`hidden md:block bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-0 overflow-hidden" : "w-64"
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            NovelSync
          </h2>
        </div>

        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeFeed === item.id;
              const isNavigation = (item as any).isNavigation;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      if (isNavigation && item.id === "explore") {
                        navigate("/explore");
                      } else {
                        onFeedChange(item.id);
                      }
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      text-sm font-medium transition-colors duration-200
                      ${
                        isActive
                          ? "bg-dark-green dark:bg-light-green text-white dark:text-black"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    <Icon size={20} />
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

export default NavigationSidebar;
