import React from "react";
import { BookOpen, Eye, ThumbsUp, TrendingUp, Clock, DollarSign } from "lucide-react";
import { StoryMetadata } from "@/types/IStory";

interface StatisticsDashboardProps {
  stories: (StoryMetadata & {
    earnings?: {
      eth: string;
      usdc: string;
    };
  })[];
}

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
  stories,
}) => {
  const totalStories = stories.length;
  const drafts = stories.filter((s) => !s.isPublished).length;
  const published = stories.filter((s) => s.isPublished).length;
  const totalViews = stories.reduce((sum, s) => sum + (s.views || 0), 0);
  const totalLikes = stories.reduce((sum, s) => sum + (s.likes || 0), 0);
  const avgViews = totalStories > 0 ? Math.round(totalViews / totalStories) : 0;
  const avgLikes = totalStories > 0 ? Math.round(totalLikes / totalStories) : 0;
  
  const totalEthEarnings = stories.reduce(
    (sum, s) => sum + parseFloat(s.earnings?.eth || "0"),
    0
  );
  const totalUsdcEarnings = stories.reduce(
    (sum, s) => sum + parseFloat(s.earnings?.usdc || "0"),
    0
  );

  const topPerformers = [...stories]
    .filter((s) => s.isPublished)
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 3);

  const recentActivity = [...stories]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 3);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="mb-8">
      {/* Total Earnings Section */}
      {(totalEthEarnings > 0 || totalUsdcEarnings > 0) && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">
            Story Earnings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {totalEthEarnings > 0 && (
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
                  {totalEthEarnings.toFixed(4)} ETH
                </p>
                <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                  ≈ ${(totalEthEarnings * 3000).toFixed(2)} USD
                </p>
              </div>
            )}
            {totalUsdcEarnings > 0 && (
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
                  {totalUsdcEarnings.toFixed(2)} USDC
                </p>
                <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                  ≈ ${totalUsdcEarnings.toFixed(2)} USD
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black/70 dark:text-white/70 mb-1">
                Total Stories
              </p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {totalStories}
              </p>
              <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                {drafts} drafts, {published} published
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-dark-green dark:text-light-green" />
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black/70 dark:text-white/70 mb-1">
                Total Views
              </p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {totalViews.toLocaleString()}
              </p>
              <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                Avg: {avgViews} per story
              </p>
            </div>
            <Eye className="w-8 h-8 text-dark-green dark:text-light-green" />
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black/70 dark:text-white/70 mb-1">
                Total Likes
              </p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {totalLikes.toLocaleString()}
              </p>
              <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                Avg: {avgLikes} per story
              </p>
            </div>
            <ThumbsUp className="w-8 h-8 text-dark-green dark:text-light-green" />
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black/70 dark:text-white/70 mb-1">
                Avg Views
              </p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {avgViews}
              </p>
              <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                Per story
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-dark-green dark:text-light-green" />
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black/70 dark:text-white/70 mb-1">
                Avg Likes
              </p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {avgLikes}
              </p>
              <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                Per story
              </p>
            </div>
            <ThumbsUp className="w-8 h-8 text-dark-green dark:text-light-green" />
          </div>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-lg p-5 shadow-sm">
          <h3 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-dark-green dark:text-light-green" />
            Top Performing Stories
          </h3>
          {topPerformers.length === 0 ? (
            <p className="text-black/70 dark:text-white/70 text-sm">
              No published stories yet
            </p>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((story, index) => (
                <div
                  key={story.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-dark-green dark:bg-light-green text-white flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-black dark:text-white truncate">
                        {story.title}
                      </p>
                      <p className="text-xs text-black/60 dark:text-white/60">
                        {story.views || 0} views
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-lg p-5 shadow-sm">
          <h3 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-dark-green dark:text-light-green" />
            Recent Activity
          </h3>
          {recentActivity.length === 0 ? (
            <p className="text-black/70 dark:text-white/70 text-sm">
              No stories yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((story) => (
                <div
                  key={story.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-black dark:text-white truncate">
                      {story.title}
                    </p>
                    <p className="text-xs text-black/60 dark:text-white/60">
                      Updated {formatDate(story.updatedAt)}
                    </p>
                  </div>
                  <span
                    className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                      story.isPublished
                        ? "bg-light-green/20 dark:bg-dark-green/20 text-dark-green dark:text-light-green"
                        : "bg-black/10 dark:bg-white/10 text-black/70 dark:text-white/70"
                    }`}
                  >
                    {story.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

