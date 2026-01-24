import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserWalletAddress } from "@/hooks/useUserWalletAddress";
import { useEarnings } from "@/hooks/useEarnings";
import { storiesRepo } from "@/services/StoriesRepo";
import { StoryMetadata } from "@/types/IStory";
import { EditableField } from "@/components/ui/editable-field";
import {
  User,
  DollarSign,
  BookOpen,
  TrendingUp,
  Wallet,
  Loader2,
  AlertCircle,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

interface StoryEarnings extends StoryMetadata {
  earnings: {
    eth: string;
    usdc: string;
  };
}

const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuthContext();
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

  // Calculate follower/following counts (excluding "default" placeholder)
  const followersCount =
    user?.followers?.filter((f) => f !== "default").length || 0;
  const followingCount =
    user?.following?.filter((f) => f !== "default").length || 0;

  // Handle profile field saves
  const handleSaveBio = async (value: string) => {
    if (!user?.uid) return;
    await updateProfile(user.uid, { bio: value });
  };

  const handleSaveOccupation = async (value: string) => {
    if (!user?.uid) return;
    await updateProfile(user.uid, { occupation: value });
  };

  const handleSaveLocation = async (value: string) => {
    if (!user?.uid) return;
    await updateProfile(user.uid, { location: value });
  };

  // Show loading if ANY data is still loading
  if (loading || walletLoading || earningsLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
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
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-20">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex items-start gap-6 mb-8">
            {/* Avatar */}
            {user?.photoURL && user.photoURL.trim() !== "" ? (
              <img
                src={user.photoURL}
                alt="User Avatar"
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-emerald-600/20 dark:border-emerald-400/20 shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-400 dark:to-emerald-600 flex items-center justify-center shadow-lg">
                <User className="w-16 h-16 md:w-20 md:h-20 text-white" />
              </div>
            )}

            {/* User Info */}
            <div className="flex-1 pt-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-black dark:text-white mb-1">
                {user?.displayName || "User"}
              </h1>
              <p className="text-black/60 dark:text-white/60 mb-4">
                {user?.email}
              </p>

              {/* Social Stats */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-black/40 dark:text-white/40" />
                  <span className="text-sm text-black dark:text-white">
                    <strong>{followersCount}</strong>{" "}
                    <span className="text-black/60 dark:text-white/60">
                      Followers
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-black dark:text-white">
                    <strong>{followingCount}</strong>{" "}
                    <span className="text-black/60 dark:text-white/60">
                      Following
                    </span>
                  </span>
                </div>
              </div>

              {/* Wallet Address */}
              {walletAddress && (
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-black/40 dark:text-white/40" />
                  <p className="text-xs font-mono text-black/60 dark:text-white/60 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 my-8" />

          {/* Editable Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <EditableField
                label="Bio"
                value={user?.bio || ""}
                onSave={handleSaveBio}
                placeholder="Write something about yourself..."
                multiline
                maxLength={300}
              />
            </div>
            <EditableField
              label="Occupation"
              value={user?.occupation || ""}
              onSave={handleSaveOccupation}
              placeholder="What do you do?"
              maxLength={50}
            />
            <EditableField
              label="Location"
              value={user?.location || ""}
              onSave={handleSaveLocation}
              placeholder="Where are you based?"
              maxLength={50}
            />
          </div>
        </div>

        {/* Earnings Overview */}
        {walletAddress && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
                Earnings Overview
              </h2>
              <span className="text-xs text-black/40 dark:text-white/40">
                From Smart Contract
              </span>
            </div>
            {!hasLifetimeEarnings ? (
              <div className="rounded-xl p-8 border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-center">
                <DollarSign className="w-12 h-12 text-black/20 dark:text-white/20 mx-auto mb-3" />
                <p className="text-sm text-black/60 dark:text-white/60 mb-1">
                  No tips received yet
                </p>
                <p className="text-xs text-black/40 dark:text-white/40">
                  Share your stories to start earning!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-black/60 dark:text-white/60">
                      ETH Earnings
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    {parseFloat(lifetimeEarnings.eth).toFixed(4)} ETH
                  </p>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    ≈ ${(parseFloat(lifetimeEarnings.eth) * 3000).toFixed(2)} USD
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-black/60 dark:text-white/60">
                      USDC Earnings
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {parseFloat(lifetimeEarnings.usdc).toFixed(2)} USDC
                  </p>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    ≈ ${parseFloat(lifetimeEarnings.usdc).toFixed(2)} USD
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Your Stories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
              Your Stories
            </h2>
            <Link
              to="/user-stories"
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              View All →
            </Link>
          </div>

          {stories.length === 0 ? (
            <div className="text-center py-12 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700">
              <BookOpen className="w-12 h-12 text-black/20 dark:text-white/20 mx-auto mb-4" />
              <p className="text-black/60 dark:text-white/60 mb-1">
                No stories yet
              </p>
              <p className="text-xs text-black/40 dark:text-white/40">
                Start writing to earn tips!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stories.map((story) => {
                const storyTotalEth = parseFloat(story.earnings.eth || "0");
                const storyTotalUsdc = parseFloat(story.earnings.usdc || "0");
                const hasEarnings = storyTotalEth > 0 || storyTotalUsdc > 0;

                return (
                  <Link
                    key={story.id}
                    to={`/story/${story.id}`}
                    className="block bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-400/50 dark:hover:border-emerald-600/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-black dark:text-white truncate">
                            {story.title}
                          </h3>
                          {story.isPublished && (
                            <span className="text-[10px] font-medium px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full flex-shrink-0">
                              Published
                            </span>
                          )}
                        </div>
                        {story.description && (
                          <p className="text-sm text-black/60 dark:text-white/60 line-clamp-1">
                            {story.description}
                          </p>
                        )}
                      </div>

                      {/* Earnings on the right */}
                      {hasEarnings && (
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {storyTotalEth > 0 && (
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {storyTotalEth.toFixed(4)} ETH
                              </span>
                            </div>
                          )}
                          {storyTotalUsdc > 0 && (
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {storyTotalUsdc.toFixed(2)} USDC
                              </span>
                            </div>
                          )}
                        </div>
                      )}
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
            <div className="p-6 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 dark:from-emerald-900/10 dark:to-blue-900/10 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">
                Total Story Earnings
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
