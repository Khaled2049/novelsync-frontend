import React, { useEffect, useState } from "react";
import { Loader, ChevronLeft, ChevronRight } from "lucide-react";

import { useAuthContext } from "../../contexts/AuthContext";
import SignInPrompt from "../../components/SignInPrompt";
import PostFeed from "./components/PostFeed";
import BookClubs from "../BookClub";
import NavigationSidebar, { FeedType } from "./components/NavigationSidebar";
import MobileTabs from "./components/MobileTabs";

const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFeed, setActiveFeed] = useState<FeedType>("home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { user } = useAuthContext();

  useEffect(() => {
    setIsLoading(false);
  }, [user?.uid]);

  if (!user) {
    return (
      <SignInPrompt
        title="Welcome to Novel Sync"
        description="Connect with authors, discover stories, and join book clubs. Sign in to start your reading journey."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader
          className="animate-spin text-dark-green dark:text-light-green"
          size={48}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 relative">
      {/* Mobile Tabs - Only visible on mobile */}
      <MobileTabs activeFeed={activeFeed} onFeedChange={setActiveFeed} />

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar - Hidden on mobile */}
        <NavigationSidebar
          activeFeed={activeFeed}
          onFeedChange={setActiveFeed}
          isCollapsed={isSidebarCollapsed}
        />

        {/* Sidebar Toggle Button - Hidden on mobile */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`
            hidden md:block absolute z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-r-lg p-2 shadow-lg
            hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200
            top-1/2 -translate-y-1/2
            ${isSidebarCollapsed ? "left-0" : "left-64"}
          `}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeFeed === "book-clubs" ? (
            <BookClubs />
          ) : (
            <div className="p-4 lg:p-6">
              <PostFeed currentUser={user} feedType={activeFeed} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
