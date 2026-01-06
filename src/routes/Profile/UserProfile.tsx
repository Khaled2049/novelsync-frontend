import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserWalletAddress } from "@/hooks/useUserWalletAddress";
import { useEarnings } from "@/hooks/useEarnings";
import { storiesRepo } from "@/services/StoriesRepo";
import { StoryMetadata } from "@/types/IStory";
import {
  User,
  DollarSign,
  BookOpen,
  TrendingUp,
  Wallet,
  Loader,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

interface StoryEarnings extends StoryMetadata {
  earnings: {
    eth: string;
    usdc: string;
  };
}

const UserProfile: React.FC = () => {
  const { user } = useAuthContext();
  const { walletAddress, loading: walletLoading } = useUserWalletAddress(
    user?.uid
  );
  const {
    lifetimeEarnings,
    fetchLifetimeEarnings,
    fetchStoryEarnings,
    loading: earningsLoading,
    error: earningsError,
  } = useEarnings();
  const [stories, setStories] = useState<StoryEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch lifetime earnings when wallet address is available
  useEffect(() => {
    if (walletAddress) {
      fetchLifetimeEarnings(walletAddress);
    }
  }, [walletAddress, fetchLifetimeEarnings]);

  const loadUserData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user stories
      const userStories = await storiesRepo.getUserStories(user.uid);

      // Fetch earnings for each story
      const storiesWithEarnings = await Promise.all(
        userStories.map(async (story) => {
          const earnings = await fetchStoryEarnings(story.id);
          return {
            ...story,
            earnings,
          };
        })
      );

      setStories(storiesWithEarnings);
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, fetchStoryEarnings]);

  useEffect(() => {
    if (user?.uid) {
      loadUserData();
    }
  }, [user?.uid, loadUserData]);

  // Show loading if ANY data is still loading
  if (loading || walletLoading || earningsLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
          <p className="text-sm text-black/60 dark:text-white/60">
            Loading profile data...
          </p>
        </div>
      </div>
    );
  }

  // Show error if there's any error
  if (error || earningsError) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-black dark:text-white">{error || earningsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalEthEarnings = stories.reduce(
    (sum, story) => sum + parseFloat(story.earnings.eth || "0"),
    0
  );
  const totalUsdcEarnings = stories.reduce(
    (sum, story) => sum + parseFloat(story.earnings.usdc || "0"),
    0
  );

  // Check if we actually have lifetime earnings data
  const hasLifetimeEarnings =
    parseFloat(lifetimeEarnings.eth) > 0 ||
    parseFloat(lifetimeEarnings.usdc) > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-6">
            {user?.photoURL && user.photoURL.trim() !== "" ? (
              <img
                src={user.photoURL}
                alt="User Avatar"
                className="w-20 h-20 rounded-full border-2 border-emerald-600 dark:border-emerald-400"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-emerald-600 dark:bg-emerald-400 flex items-center justify-center">
                <User className="w-10 h-10 text-white dark:text-black" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                {user?.displayName || "User"}
              </h1>
              <p className="text-black/60 dark:text-white/60">{user?.email}</p>
              {walletAddress && (
                <div className="mt-2 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-black/40 dark:text-white/40" />
                  <p className="text-xs font-mono text-black/60 dark:text-white/60">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lifetime Earnings Card */}
        {walletAddress && (
          <div className="mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">
              Lifetime Earnings (From Smart Contract)
            </h2>
            {!hasLifetimeEarnings ? (
              <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 text-center">
                <DollarSign className="w-12 h-12 text-black/20 dark:text-white/20 mx-auto mb-2" />
                <p className="text-sm text-black/60 dark:text-white/60">
                  No tips received yet. Share your stories to start earning!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-black/60 dark:text-white/60">
                        ETH Earnings
                      </span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {parseFloat(lifetimeEarnings.eth).toFixed(4)} ETH
                  </p>
                  <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                    ≈ ${(parseFloat(lifetimeEarnings.eth) * 3000).toFixed(2)}{" "}
                    USD
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-black/60 dark:text-white/60">
                        USDC Earnings
                      </span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {parseFloat(lifetimeEarnings.usdc).toFixed(2)} USDC
                  </p>
                  <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                    ≈ ${parseFloat(lifetimeEarnings.usdc).toFixed(2)} USD
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stories Earnings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
              Story Earnings (Calculated from Stories)
            </h2>
            <Link
              to="/user-stories"
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View All Stories
            </Link>
          </div>

          {stories.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <BookOpen className="w-12 h-12 text-black/20 dark:text-white/20 mx-auto mb-4" />
              <p className="text-black/60 dark:text-white/60">
                No stories yet. Start writing to earn tips!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => {
                const storyTotalEth = parseFloat(story.earnings.eth || "0");
                const storyTotalUsdc = parseFloat(story.earnings.usdc || "0");
                const hasEarnings = storyTotalEth > 0 || storyTotalUsdc > 0;

                return (
                  <Link
                    key={story.id}
                    to={`/story/${story.id}`}
                    className="block bg-neutral-50 dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-black dark:text-white">
                            {story.title}
                          </h3>
                          {story.isPublished && (
                            <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                              Published
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-black/60 dark:text-white/60 mb-4 line-clamp-2">
                          {story.description}
                        </p>
                        {hasEarnings ? (
                          <div className="flex items-center gap-6">
                            {storyTotalEth > 0 && (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-sm font-medium text-black dark:text-white">
                                  {storyTotalEth.toFixed(4)} ETH
                                </span>
                              </div>
                            )}
                            {storyTotalUsdc > 0 && (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-black dark:text-white">
                                  {storyTotalUsdc.toFixed(2)} USDC
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-black/40 dark:text-white/40">
                            No earnings yet
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        {stories.length > 0 &&
          (totalEthEarnings > 0 || totalUsdcEarnings > 0) && (
            <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <h3 className="text-sm font-semibold text-black/70 dark:text-white/70 mb-4">
                Total Story Earnings (Sum of Individual Stories)
              </h3>
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-xs text-black/50 dark:text-white/50 mb-1">
                    ETH
                  </p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {totalEthEarnings.toFixed(4)} ETH
                  </p>
                </div>
                <div>
                  <p className="text-xs text-black/50 dark:text-white/50 mb-1">
                    USDC
                  </p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {totalUsdcEarnings.toFixed(2)} USDC
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default UserProfile;
