import React, { useState, useMemo } from "react";
import {
  MessageCircle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { IPostComment } from "@/types/IPostComment";
import { IUser } from "@/types/IUser";
import VoteButtons from "@/components/VoteButtons";
import { voteService } from "@/services/VoteService";

interface PostCommentProps {
  comment: IPostComment;
  allComments: IPostComment[];
  currentUser: IUser | null;
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  depth: number;
}

const MAX_DEPTH = 3;

export const PostComment: React.FC<PostCommentProps> = React.memo(
  ({ comment, allComments, currentUser, onReply, onDelete, onEdit, depth }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [upvoteCount, setUpvoteCount] = useState(comment.upvoteCount || 0);
    const [downvoteCount, setDownvoteCount] = useState(
      comment.downvoteCount || 0
    );
    const [userVote, setUserVote] = useState<"up" | "down" | null>(
      comment.userVote || null
    );
    const [isVoting, setIsVoting] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const replies = useMemo(
      () => allComments.filter((c) => c.parentId === comment.id),
      [allComments, comment.id]
    );

    const handleEdit = async () => {
      if (editedContent.trim() === "") return;
      setIsLoading(true);
      try {
        await onEdit(comment.id, editedContent.trim());
        setIsEditing(false);
        setError(null);
      } catch (err) {
        setError("Failed to update comment");
      } finally {
        setIsLoading(false);
      }
    };

    const handleReply = async () => {
      if (replyContent.trim() === "") return;
      setIsLoading(true);
      try {
        await onReply(comment.id, replyContent.trim());
        setReplyContent("");
        setIsReplying(false);
        setError(null);
      } catch (err: any) {
        // Check if it's a rate limit error
        if (
          err?.code === "RATE_LIMIT_EXCEEDED" ||
          err?.message?.includes("daily limit")
        ) {
          setError(
            err.message ||
              "You have reached the daily comment limit. Please try again tomorrow."
          );
        } else {
          setError("Failed to post reply");
        }
      } finally {
        setIsLoading(false);
      }
    };

    const handleVote = async (voteType: "up" | "down" | null) => {
      if (!currentUser || isVoting) return;

      // Optimistic update
      const previousVote = userVote;
      const previousUpvotes = upvoteCount;
      const previousDownvotes = downvoteCount;

      // Calculate new counts optimistically
      let newUpvotes = previousUpvotes;
      let newDownvotes = previousDownvotes;

      if (previousVote === "up") {
        newUpvotes -= 1;
      } else if (previousVote === "down") {
        newDownvotes -= 1;
      }

      if (voteType === "up") {
        newUpvotes += 1;
      } else if (voteType === "down") {
        newDownvotes += 1;
      }

      setUpvoteCount(newUpvotes);
      setDownvoteCount(newDownvotes);
      setUserVote(voteType);
      setIsVoting(true);

      try {
        await voteService.voteComment(
          comment.postId,
          comment.id,
          currentUser.uid,
          voteType
        );
      } catch (error) {
        console.error("Error voting on comment:", error);
        // Revert optimistic update on error
        setUpvoteCount(previousUpvotes);
        setDownvoteCount(previousDownvotes);
        setUserVote(previousVote);
      } finally {
        setIsVoting(false);
      }
    };

    const formatDate = (date: Date | any) => {
      if (!date) return "Just now";
      const d = date instanceof Date ? date : date.toDate();
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString();
    };

    const marginLeftClass = depth > 0 ? `ml-${Math.min(depth * 4, 16)}` : "";
    const hasReplies = replies.length > 0;

    return (
      <div
        className={`${marginLeftClass} mt-1`}
        style={depth > 0 ? { marginLeft: `${depth * 0.75}rem` } : undefined}
      >
        <div className="flex items-start gap-1">
          {/* Collapse/Expand Button */}
          {hasReplies && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="mt-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
              aria-label={isCollapsed ? "Expand comment" : "Collapse comment"}
            >
              {isCollapsed ? (
                <ChevronRight size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </button>
          )}
          {!hasReplies && <div className="w-3" />}

          <div className="flex-1 min-w-0">
            <div className="py-1.5 px-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
              {/* Error Message */}
              {error && (
                <div className="mb-1 text-xs text-red-500 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Comment Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                    {comment.authorName}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
              </div>

              {/* Comment Content */}
              {!isCollapsed && (
                <>
                  {isEditing ? (
                    <div className="mt-1">
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full p-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-dark-green dark:focus:ring-light-green transition-all disabled:opacity-50 text-xs"
                        rows={2}
                        disabled={isLoading}
                      />
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          onClick={handleEdit}
                          className="px-2 py-0.5 text-[10px] font-medium rounded bg-dark-green dark:bg-light-green text-white dark:text-black hover:bg-light-green dark:hover:bg-dark-green disabled:opacity-50 transition-colors"
                          disabled={isLoading}
                        >
                          {isLoading ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-2 py-0.5 text-[10px] font-medium rounded bg-gray-500 dark:bg-gray-600 text-white hover:bg-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-800 dark:text-gray-200">
                      {comment.content}
                    </p>
                  )}

                  {/* Comment Actions */}
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-3 text-[10px]">
                      <VoteButtons
                        upvoteCount={upvoteCount}
                        downvoteCount={downvoteCount}
                        userVote={userVote}
                        onVote={handleVote}
                        isLoading={isVoting}
                        disabled={!currentUser}
                        size="sm"
                      />
                      {depth < MAX_DEPTH && (
                        <button
                          onClick={() => setIsReplying(!isReplying)}
                          className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                          disabled={isLoading}
                        >
                          <MessageCircle size={12} />
                          <span>Reply</span>
                        </button>
                      )}
                      {currentUser?.uid === comment.authorId && (
                        <>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            disabled={isLoading}
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => onDelete(comment.id)}
                            className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                            disabled={isLoading}
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Reply Form */}
                  {isReplying && (
                    <div className="mt-2">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full p-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-1 focus:ring-dark-green dark:focus:ring-light-green transition-all disabled:opacity-50 text-xs"
                        rows={2}
                        disabled={isLoading}
                      />
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          onClick={handleReply}
                          className="px-2 py-0.5 text-[10px] font-medium rounded bg-dark-green dark:bg-light-green text-white dark:text-black hover:bg-light-green dark:hover:bg-dark-green disabled:opacity-50 transition-colors"
                          disabled={isLoading}
                        >
                          {isLoading ? "Posting..." : "Reply"}
                        </button>
                        <button
                          onClick={() => setIsReplying(false)}
                          className="px-2 py-0.5 text-[10px] font-medium rounded bg-gray-500 dark:bg-gray-600 text-white hover:bg-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Collapsed View */}
              {isCollapsed && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {comment.authorName}
                  </span>
                  <span className="text-[10px]">
                    {formatDate(comment.createdAt)}
                  </span>
                  {hasReplies && (
                    <span className="text-[10px]">
                      • {replies.length}{" "}
                      {replies.length === 1 ? "reply" : "replies"}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Nested Replies */}
            {hasReplies && !isCollapsed && (
              <div className="mt-1">
                {replies.map((reply) => (
                  <PostComment
                    key={reply.id}
                    comment={reply}
                    allComments={allComments}
                    currentUser={currentUser}
                    onReply={onReply}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

PostComment.displayName = "PostComment";
