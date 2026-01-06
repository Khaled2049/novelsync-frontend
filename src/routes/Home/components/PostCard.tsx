import React, { useState, useEffect } from "react";
import { MessageCircle, BookOpen, Trash2 } from "lucide-react";
import { IPost } from "@/types/IPost";
import { IUser } from "@/types/IUser";
import { Link } from "react-router-dom";
import PostCommentSection from "./PostCommentSection";
import VoteButtons from "@/components/VoteButtons";
import ReportButton from "@/components/ReportButton";
import { voteService } from "@/services/VoteService";
import { reportService } from "@/services/ReportService";
import { postsService } from "@/services/PostService";

interface PostCardProps {
  post: IPost;
  currentUser: IUser | null;
  bookClubName?: string;
  onPostDeleted?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  bookClubName,
  onPostDeleted,
}) => {
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [upvoteCount, setUpvoteCount] = useState(post.upvoteCount || 0);
  const [downvoteCount, setDownvoteCount] = useState(post.downvoteCount || 0);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(
    post.userVote || null
  );
  const [isVoting, setIsVoting] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Check if user has reported this post
    const checkReported = async () => {
      if (currentUser) {
        const reported = await reportService.hasUserReported(
          post.id,
          currentUser.uid
        );
        setHasReported(reported);
      }
    };
    checkReported();
  }, [post.id, currentUser]);

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
      await voteService.votePost(post.id, currentUser.uid, voteType);
    } catch (error) {
      console.error("Error voting on post:", error);
      // Revert optimistic update on error
      setUpvoteCount(previousUpvotes);
      setDownvoteCount(previousDownvotes);
      setUserVote(previousVote);
    } finally {
      setIsVoting(false);
    }
  };

  const handleReport = async (reason?: string) => {
    if (!currentUser) return;

    try {
      await reportService.reportPost(post.id, currentUser.uid, reason);
      setHasReported(true);
      // Optimistically remove post from feed
      onPostDeleted?.(post.id);
    } catch (error) {
      console.error("Error reporting post:", error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!currentUser || currentUser.uid !== post.authorId) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await postsService.deletePost(post.id, post.authorId);
      // Call callback to remove post from feed
      onPostDeleted?.(post.id);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date | any) => {
    if (!date) return "Just now";
    const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
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

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-dark-green dark:bg-light-green flex items-center justify-center text-white dark:text-black font-semibold">
            {post.authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {post.authorName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(post.createdAt)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {post.bookClubId && bookClubName && (
            <Link
              to={`/book-clubs/${post.bookClubId}`}
              className="flex items-center gap-1 text-xs text-dark-green dark:text-light-green hover:underline"
            >
              <BookOpen size={14} />
              {bookClubName}
            </Link>
          )}
          {currentUser?.uid === post.authorId && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50"
              title="Delete post"
            >
              {isDeleting ? "Deleting..." : <Trash2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center gap-4">
          <VoteButtons
            upvoteCount={upvoteCount}
            downvoteCount={downvoteCount}
            userVote={userVote}
            onVote={handleVote}
            isLoading={isVoting}
            disabled={!currentUser}
          />
          <div className="flex items-center gap-1">
            <MessageCircle size={16} />
            <span>
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </span>
          </div>
        </div>
        {currentUser && (
          <ReportButton onReport={handleReport} hasReported={hasReported} />
        )}
      </div>

      {/* Comment Section */}
      <PostCommentSection
        postId={post.id}
        currentUser={currentUser}
        onCommentCountChange={setCommentCount}
      />
    </div>
  );
};

export default PostCard;
