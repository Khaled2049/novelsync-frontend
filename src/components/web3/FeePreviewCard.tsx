import React from "react";
import { FeeSplit } from "@/types/tipping";
import { Card } from "../ui/card";

interface FeePreviewCardProps {
  feeSplit: FeeSplit | null;
  isLoading?: boolean;
  tokenSymbol?: string;
}

export const FeePreviewCard: React.FC<FeePreviewCardProps> = ({
  feeSplit,
  isLoading = false,
  tokenSymbol = "ETH",
}) => {
  if (isLoading) {
    return (
      <Card className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (!feeSplit) {
    return null;
  }

  const platformFeePercent =
    feeSplit.totalAmount && parseFloat(feeSplit.totalAmount) > 0
      ? (
          (parseFloat(feeSplit.platformFee) /
            parseFloat(feeSplit.totalAmount)) *
          100
        ).toFixed(1)
      : "0";

  return (
    <Card className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
      <h4 className="text-sm font-semibold text-black dark:text-white mb-3">
        Fee Breakdown
      </h4>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-black/70 dark:text-white/70">
            Total Amount
          </span>
          <span className="text-sm font-medium text-black dark:text-white">
            {parseFloat(feeSplit.totalAmount).toFixed(6)} {tokenSymbol}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-black/70 dark:text-white/70">
            Author Receives
          </span>
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {parseFloat(feeSplit.authorAmount).toFixed(6)} {tokenSymbol}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-black/70 dark:text-white/70">
            Platform Fee
          </span>
          <span className="text-sm font-medium text-black/60 dark:text-white/60">
            {parseFloat(feeSplit.platformFee).toFixed(6)} {tokenSymbol} (
            {platformFeePercent}%)
          </span>
        </div>
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex justify-between items-center">
            <span className="text-xs text-black/50 dark:text-white/50">
              Platform fee is automatically deducted
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
