import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { IPostComment } from "@/types/IPostComment";
import { IUser } from "@/types/IUser";
import { postCommentService } from "@/services/PostCommentService";
import { voteService } from "@/services/VoteService";
import { PostComment } from "./PostComment";

interface PostCommentSectionProps {
  postId: string;
  currentUser: IUser | null;
  onCommentCountChange?: (count: number) => void;
}

const PostCommentSection: React.FC<PostCommentSectionProps> = ({
  postId,
  currentUser,
  onCommentCountChange,
}) => {
  const [comments, setComments] = useState<IPostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [postId, showComments]);

  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const fetchedComments = await postCommentService.getComments(postId);

      // Fetch user votes and merge into comments
      if (currentUser && fetchedComments.length > 0) {
        const commentIds = fetchedComments.map((c) => c.id);
        const userVotes = await voteService.getUserVotesForComments(
          postId,
          commentIds,
          currentUser.uid
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
        authorName:
          currentUser.displayName || currentUser.username || "Anonymous",
        parentId: null,
        upvoteCount: 0,
        downvoteCount: 0,
      });
      setNewComment("");
      setCommentError(null);
      await loadComments();
    } catch (error: any) {
      console.error("Error adding comment:", error);
      // Check if it's a rate limit error
      if (
        error?.code === "RATE_LIMIT_EXCEEDED" ||
        error?.message?.includes("daily limit")
      ) {
        setCommentError(
          error.message ||
            "You have reached the daily comment limit. Please try again tomorrow."
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
        authorName:
          currentUser.displayName || currentUser.username || "Anonymous",
        parentId,
        upvoteCount: 0,
        downvoteCount: 0,
      });
      await loadComments();
    } catch (error: any) {
      console.error("Error replying to comment:", error);
      // Re-throw with proper error message for rate limits
      if (
        error?.code === "RATE_LIMIT_EXCEEDED" ||
        error?.message?.includes("daily limit")
      ) {
        const rateLimitError = new Error(
          error.message ||
            "You have reached the daily comment limit. Please try again tomorrow."
        );
        (rateLimitError as any).code = "RATE_LIMIT_EXCEEDED";
        throw rateLimitError;
      }
      throw error;
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      await postCommentService.deleteComment(postId, commentId);
      await loadComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
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

  // Filter top-level comments (no parent)
  const topLevelComments = comments.filter((c) => !c.parentId);

  return (
    <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
      {!showComments ? (
        <button
          onClick={() => setShowComments(true)}
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          {comments.length > 0
            ? `View ${comments.length} ${
                comments.length === 1 ? "comment" : "comments"
              }`
            : "Add a comment"}
        </button>
      ) : (
        <div className="space-y-2">
          {/* Comment Input */}
          {currentUser && (
            <form onSubmit={handleSubmit} className="space-y-1.5">
              {commentError && (
                <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                  {commentError}
                </div>
              )}
              <Textarea
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  setCommentError(null);
                }}
                placeholder="Write a comment..."
                className="min-h-[60px] resize-none text-xs"
                disabled={isLoading}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isLoading}
                  size="sm"
                  className="bg-dark-green dark:bg-light-green text-white dark:text-black hover:bg-light-green dark:hover:bg-dark-green text-xs h-7 px-3"
                >
                  <Send size={12} className="mr-1.5" />
                  {isLoading ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </form>
          )}

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="text-xs text-gray-500 dark:text-gray-400 py-3">
              Loading comments...
            </div>
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
            <div className="text-xs text-gray-500 dark:text-gray-400 py-3 text-center">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCommentSection;
