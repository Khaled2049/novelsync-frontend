import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoteButtonsProps {
  upvoteCount: number;
  downvoteCount: number;
  userVote: "up" | "down" | null | undefined;
  onVote: (voteType: "up" | "down" | null) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  size?: "sm" | "default";
}

const VoteButtons: React.FC<VoteButtonsProps> = ({
  upvoteCount,
  downvoteCount,
  userVote,
  onVote,
  isLoading = false,
  disabled = false,
  size = "default",
}) => {
  const handleVote = async (voteType: "up" | "down") => {
    if (disabled || isLoading) return;

    // Toggle: if clicking the same button, remove vote
    const newVote = userVote === voteType ? null : voteType;
    await onVote(newVote);
  };

  const iconSize = size === "sm" ? 16 : 18;
  const buttonSize = size === "sm" ? "sm" : "default";

  return (
    <div className="flex items-center gap-1">
      {/* Upvote Button */}
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={() => handleVote("up")}
        disabled={disabled || isLoading}
        className={`flex items-center gap-1 px-2 ${
          userVote === "up"
            ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
            : "text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
        }`}
      >
        <ChevronUp size={iconSize} />
        <span className="text-xs font-medium">{upvoteCount}</span>
      </Button>

      {/* Downvote Button */}
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={() => handleVote("down")}
        disabled={disabled || isLoading}
        className={`flex items-center gap-1 px-2 ${
          userVote === "down"
            ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
            : "text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
        }`}
      >
        <ChevronDown size={iconSize} />
        <span className="text-xs font-medium">{downvoteCount}</span>
      </Button>
    </div>
  );
};

export default VoteButtons;
