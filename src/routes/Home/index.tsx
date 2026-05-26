import React, { useEffect, useState } from "react";
import { Loader } from "lucide-react";

import { useAuthContext } from "../../contexts/AuthContext";
import PostFeed from "./components/PostFeed";
import FeedNavigation, { FeedType } from "./components/FeedNavigation";
const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFeed, setActiveFeed] = useState<FeedType>("home");

  const { user } = useAuthContext();

  useEffect(() => {
    setIsLoading(false);
  }, [user?.uid]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader className="animate-spin text-ns-accent" size={36} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      <FeedNavigation activeFeed={activeFeed} onFeedChange={setActiveFeed} />

      <PostFeed currentUser={user} feedType={activeFeed} />
    </div>
  );
};

export default Home;
