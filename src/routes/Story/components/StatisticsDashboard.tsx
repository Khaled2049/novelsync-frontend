import React from "react";
import { DollarSign } from "lucide-react";
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
  const totalEthEarnings = stories.reduce(
    (sum, s) => sum + parseFloat(s.earnings?.eth || "0"),
    0,
  );
  const totalUsdcEarnings = stories.reduce(
    (sum, s) => sum + parseFloat(s.earnings?.usdc || "0"),
    0,
  );

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
    </div>
  );
};
