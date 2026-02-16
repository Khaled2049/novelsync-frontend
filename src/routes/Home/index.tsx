import React, { useEffect, useState } from "react";
import { Loader } from "lucide-react";

import { useAuthContext } from "../../contexts/AuthContext";
import SignInPrompt from "../../components/SignInPrompt";
import PostFeed from "./components/PostFeed";
import BookClubs from "../BookClub";
import FeedNavigation, { FeedType } from "./components/FeedNavigation";
import MobileTabs from "./components/MobileTabs";

const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFeed, setActiveFeed] = useState<FeedType>("home");

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
          className="animate-spin text-ns-accent"
          size={48}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-ns-bg">
      {/* Mobile Tabs - Only visible on mobile */}
      <MobileTabs activeFeed={activeFeed} onFeedChange={setActiveFeed} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 lg:p-6">
          {/* Feed Navigation - Hidden on mobile */}
          <FeedNavigation
            activeFeed={activeFeed}
            onFeedChange={setActiveFeed}
          />

          {activeFeed === "book-clubs" ? (
            <BookClubs />
          ) : (
            <PostFeed currentUser={user} feedType={activeFeed} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
