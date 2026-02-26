import React, { useEffect, useState } from "react";
import { Loader } from "lucide-react";

import { useAuthContext } from "../../contexts/AuthContext";
import SignInPrompt from "../../components/SignInPrompt";
import PostFeed from "./components/PostFeed";
import BookClubs from "../BookClub";
import FeedNavigation, { FeedType } from "./components/FeedNavigation";
import { APP_NAME } from "@/config/seo";

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
        title={`Welcome to ${APP_NAME}`}
        description="Connect with authors, discover stories, and join book clubs. Sign in to start your reading journey."
      />
    );
  }

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

      {activeFeed === "book-clubs" ? (
        <BookClubs />
      ) : (
        <PostFeed currentUser={user} feedType={activeFeed} />
      )}
    </div>
  );
};

export default Home;
