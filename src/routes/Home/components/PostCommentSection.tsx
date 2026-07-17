import React, { useEffect, useState } from "react";
import { Send, ChevronUp } from "lucide-react";
import { IPostComment } from "@/types/IPostComment";
import { IUser } from "@/types/IUser";
import { postCommentService } from "@/services/PostCommentService";
import { voteService } from "@/services/VoteService";
import { PostComment } from "./PostComment";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface PostCommentSectionProps {
  postId: string;
  currentUser: IUser | null;
  onCommentCountChange?: (count: number) => void;
  onHideComments?: () => void;
}

const PostCommentSection: React.FC<PostCommentSectionProps> = ({
  postId,
  currentUser,
  onCommentCountChange,
  onHideComments,
}) => {
  const [comments, setComments] = useState<IPostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const fetchedComments = await postCommentService.getComments(postId);

      if (currentUser && fetchedComments.length > 0) {
        const commentIds = fetchedComments.map((c) => c.id);
        const userVotes = await voteService.getUserVotesForComments(
          postId,
          commentIds,
          currentUser.uid,
        );
        fetchedComments.forEach((comment) => {
          comment.userVote = userVotes.get(comment.id) || null;
        });
      }

      setComments(fetchedComments);
      onCommentCountChange?.(fetchedComments.length);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim() || isLoading) return;

    setIsLoading(true);
    setCommentError(null);
    try {
      await postCommentService.addComment(postId, {
        postId,
        content: newComment.trim(),
        authorId: currentUser.uid,
        authorUsername: currentUser.username || "unknown",
        parentId: null,
        upvoteCount: 0,
        downvoteCount: 0,
      });
      setNewComment("");
      await loadComments();
    } catch (error: any) {
      console.error("Error adding comment:", error);
      if (
        error?.code === "RATE_LIMIT_EXCEEDED" ||
        error?.message?.includes("daily limit")
      ) {
        setCommentError(
          error.message ||
            "You have reached the daily comment limit. Please try again tomorrow.",
        );
      } else {
        setCommentError("Failed to add comment. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    if (!currentUser) return;
    try {
      await postCommentService.addComment(postId, {
        postId,
        content,
        authorId: currentUser.uid,
        authorUsername: currentUser.username || "unknown",
        parentId,
        upvoteCount: 0,
        downvoteCount: 0,
      });
      await loadComments();
    } catch (error: any) {
      if (
        error?.code === "RATE_LIMIT_EXCEEDED" ||
        error?.message?.includes("daily limit")
      ) {
        const rateLimitError = new Error(
          error.message ||
            "You have reached the daily comment limit. Please try again tomorrow.",
        );
        (rateLimitError as any).code = "RATE_LIMIT_EXCEEDED";
        throw rateLimitError;
      }
      throw error;
    }
  };

  const handleDelete = async (commentId: string) => {
    setPendingDeleteId(commentId);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setIsDeletingComment(true);
    try {
      await postCommentService.deleteComment(postId, pendingDeleteId);
      await loadComments();
      setPendingDeleteId(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      await postCommentService.updateComment(postId, commentId, content);
      await loadComments();
    } catch (error) {
      console.error("Error editing comment:", error);
      throw error;
    }
  };

  const topLevelComments = comments.filter((c) => !c.parentId);

  return (
    <div className="mt-3 pt-3 border-t border-ns-border">
      {onHideComments && (
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={onHideComments}
            className="flex items-center gap-1 font-ui text-xs text-ns-ink-muted hover:text-ns-ink transition-colors"
          >
            <ChevronUp size={14} />
            Hide comments
          </button>
        </div>
      )}
      {/* Comment input */}
      {currentUser && (
        <form onSubmit={handleSubmit} className="mb-4">
          {commentError && (
            <p className="mb-2 text-xs font-ui text-ns-destructive">
              {commentError}
            </p>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setCommentError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment…"
              rows={2}
              disabled={isLoading}
              className="flex-1 resize-none px-3 py-2 rounded-ns bg-ns-elevated border border-ns-border text-ns-ink placeholder:text-ns-ink-muted font-body text-xs leading-relaxed focus:outline-none focus:border-ns-border-strong transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isLoading}
              className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 bg-ns-accent text-white rounded-ns font-ui text-xs font-medium hover:bg-ns-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={11} />
              {isLoading ? "…" : "Post"}
            </button>
          </div>
        </form>
      )}

      {/* Comments list */}
      {isLoadingComments ? (
        <p className="font-ui text-xs text-ns-ink-muted">Loading comments…</p>
      ) : topLevelComments.length > 0 ? (
        <div className="space-y-1">
          {topLevelComments.map((comment) => (
            <PostComment
              key={comment.id}
              comment={comment}
              allComments={comments}
              currentUser={currentUser}
              onReply={handleReply}
              onDelete={handleDelete}
              onEdit={handleEdit}
              depth={0}
            />
          ))}
        </div>
      ) : (
        <p className="font-ui text-xs text-ns-ink-muted text-center py-2">
          No comments yet. Be the first!
        </p>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        title="Delete comment?"
        description="This comment and all its replies will be permanently deleted. This cannot be undone."
        confirmLabel="Delete comment"
        cancelLabel="Keep comment"
        variant="danger"
        isLoading={isDeletingComment}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default PostCommentSection;
