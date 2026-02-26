import React, { useState, useMemo } from "react";
import { MessageCircle, Edit2, Trash2, ChevronDown, ChevronRight } from "lucide-react";
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
    const [downvoteCount, setDownvoteCount] = useState(comment.downvoteCount || 0);
    const [userVote, setUserVote] = useState<"up" | "down" | null>(comment.userVote || null);
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
      } catch {
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
        if (err?.code === "RATE_LIMIT_EXCEEDED" || err?.message?.includes("daily limit")) {
          setError(err.message || "You have reached the daily comment limit. Please try again tomorrow.");
        } else {
          setError("Failed to post reply");
        }
      } finally {
        setIsLoading(false);
      }
    };

    const handleVote = async (voteType: "up" | "down" | null) => {
      if (!currentUser || isVoting) return;

      const previousVote = userVote;
      const previousUpvotes = upvoteCount;
      const previousDownvotes = downvoteCount;

      let newUpvotes = previousUpvotes;
      let newDownvotes = previousDownvotes;

      if (previousVote === "up") newUpvotes -= 1;
      else if (previousVote === "down") newDownvotes -= 1;
      if (voteType === "up") newUpvotes += 1;
      else if (voteType === "down") newDownvotes += 1;

      setUpvoteCount(newUpvotes);
      setDownvoteCount(newDownvotes);
      setUserVote(voteType);
      setIsVoting(true);

      try {
        await voteService.voteComment(comment.postId, comment.id, currentUser.uid, voteType);
      } catch (error) {
        console.error("Error voting on comment:", error);
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
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return d.toLocaleDateString();
    };

    const hasReplies = replies.length > 0;

    return (
      <div
        className="mt-1.5"
        style={depth > 0 ? { marginLeft: `${depth * 0.875}rem` } : undefined}
      >
        <div className="flex items-start gap-1.5">
          {/* Collapse toggle */}
          {hasReplies ? (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="mt-1 text-ns-ink-muted hover:text-ns-ink transition-colors flex-shrink-0"
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
            </button>
          ) : (
            <div className="w-[11px]" />
          )}

          <div className="flex-1 min-w-0">
            <div className="px-3 py-2 rounded-ns bg-ns-surface border border-ns-border">
              {error && (
                <p className="mb-1 text-[10px] font-ui text-ns-destructive">{error}</p>
              )}

              {/* Comment Header */}
              <div className="flex items-center gap-2 mb-1">
                <span className="font-ui font-semibold text-ns-ink text-xs">{comment.authorName}</span>
                <span className="font-ui text-[10px] text-ns-ink-muted">{formatDate(comment.createdAt)}</span>
              </div>

              {/* Content */}
              {!isCollapsed && (
                <>
                  {isEditing ? (
                    <div className="mt-1 space-y-1.5">
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={2}
                        disabled={isLoading}
                        className="
                          w-full px-2 py-1.5 rounded-ns
                          bg-ns-elevated border border-ns-border
                          text-ns-ink font-body text-xs leading-relaxed
                          focus:outline-none focus:border-ns-accent/50
                          transition-colors disabled:opacity-50 resize-none
                        "
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={handleEdit}
                          disabled={isLoading}
                          className="px-2.5 py-0.5 text-[10px] font-ui font-medium rounded-full bg-ns-accent text-white hover:bg-ns-accent-hover disabled:opacity-40 transition-colors"
                        >
                          {isLoading ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          disabled={isLoading}
                          className="px-2.5 py-0.5 text-[10px] font-ui font-medium rounded-full bg-ns-surface-hover text-ns-ink-secondary hover:text-ns-ink disabled:opacity-40 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-body text-xs text-ns-ink leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-2">
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
                        disabled={isLoading}
                        className="flex items-center gap-1 font-ui text-[10px] text-ns-ink-muted hover:text-ns-accent transition-colors"
                      >
                        <MessageCircle size={10} />
                        Reply
                      </button>
                    )}
                    {currentUser?.uid === comment.authorId && (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          disabled={isLoading}
                          className="flex items-center gap-1 font-ui text-[10px] text-ns-ink-muted hover:text-ns-ink transition-colors"
                        >
                          <Edit2 size={10} />
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(comment.id)}
                          disabled={isLoading}
                          className="flex items-center gap-1 font-ui text-[10px] text-ns-ink-muted hover:text-ns-destructive transition-colors"
                        >
                          <Trash2 size={10} />
                          Delete
                        </button>
                      </>
                    )}
                  </div>

                  {/* Reply Form */}
                  {isReplying && (
                    <div className="mt-2 space-y-1.5">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply…"
                        rows={2}
                        disabled={isLoading}
                        className="
                          w-full px-2 py-1.5 rounded-ns
                          bg-ns-elevated border border-ns-border
                          text-ns-ink placeholder:text-ns-ink-muted
                          font-body text-xs leading-relaxed
                          focus:outline-none focus:border-ns-accent/50
                          transition-colors disabled:opacity-50 resize-none
                        "
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={handleReply}
                          disabled={isLoading}
                          className="px-2.5 py-0.5 text-[10px] font-ui font-medium rounded-full bg-ns-accent text-white hover:bg-ns-accent-hover disabled:opacity-40 transition-colors"
                        >
                          {isLoading ? "Posting…" : "Reply"}
                        </button>
                        <button
                          onClick={() => setIsReplying(false)}
                          disabled={isLoading}
                          className="px-2.5 py-0.5 text-[10px] font-ui font-medium rounded-full bg-ns-surface-hover text-ns-ink-secondary hover:text-ns-ink disabled:opacity-40 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Collapsed preview */}
              {isCollapsed && (
                <div className="flex items-center gap-1.5 font-ui text-xs text-ns-ink-muted">
                  <span className="text-ns-ink font-medium">{comment.authorName}</span>
                  <span className="text-[10px]">{formatDate(comment.createdAt)}</span>
                  {hasReplies && (
                    <span className="text-[10px]">
                      · {replies.length} {replies.length === 1 ? "reply" : "replies"}
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
