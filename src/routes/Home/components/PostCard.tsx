import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  BookOpen,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { IPost } from "@/types/IPost";
import { IUser } from "@/types/IUser";
import { Link } from "react-router-dom";
import PostCommentSection from "./PostCommentSection";
import VoteButtons from "@/components/community/VoteButtons";
import ReportButton from "@/components/community/ReportButton";
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
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(post.upvoteCount || 0);
  const [downvoteCount, setDownvoteCount] = useState(post.downvoteCount || 0);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(
    post.userVote || null,
  );
  const [isVoting, setIsVoting] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const checkReported = async () => {
      if (currentUser) {
        const reported = await reportService.hasUserReported(
          post.id,
          currentUser.uid,
        );
        setHasReported(reported);
      }
    };
    checkReported();
  }, [post.id, currentUser]);

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
      await voteService.votePost(post.id, currentUser.uid, voteType);
    } catch (error) {
      console.error("Error voting on post:", error);
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
        "Are you sure you want to delete this post? This action cannot be undone.",
      )
    )
      return;

    setIsDeleting(true);
    try {
      await postsService.deletePost(post.id, post.authorId);
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

  const initials = post.authorName.charAt(0).toUpperCase();

  return (
    <div className="bg-ns-elevated border border-ns-border rounded-ns-lg p-5 mb-3 shadow-ns-sm hover:shadow-ns transition-shadow duration-200 overflow-hidden">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-ns-accent flex items-center justify-center text-white font-ui font-semibold text-sm flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="font-ui font-semibold text-ns-ink text-sm leading-tight">
              {post.authorName}
            </div>
            <div className="font-ui text-xs text-ns-ink-muted mt-0.5">
              {formatDate(post.createdAt)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {post.bookClubId && bookClubName && (
            <Link
              to={`/book-clubs/${post.bookClubId}`}
              className="flex items-center gap-1 text-xs font-ui text-ns-accent hover:text-ns-accent-hover transition-colors no-underline"
            >
              <BookOpen size={13} />
              <span>{bookClubName}</span>
            </Link>
          )}
          {currentUser?.uid === post.authorId && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-ns-ink-muted hover:text-ns-destructive transition-colors disabled:opacity-40"
              title="Delete post"
            >
              {isDeleting ? (
                <span className="font-ui text-xs">Deleting…</span>
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Post Content */}
      <p className="font-body text-ns-ink whitespace-pre-wrap leading-relaxed mb-4 text-[0.9375rem]">
        {post.content}
      </p>

      {/* Post Actions */}
      <div className="flex items-center justify-between border-t border-ns-border pt-3">
        <div className="flex items-center gap-4">
          <VoteButtons
            upvoteCount={upvoteCount}
            downvoteCount={downvoteCount}
            userVote={userVote}
            onVote={handleVote}
            isLoading={isVoting}
            disabled={!currentUser}
          />
          <button
            type="button"
            onClick={() => setCommentsExpanded((prev) => !prev)}
            className="flex items-center gap-1.5 font-ui text-xs text-ns-ink-secondary hover:text-ns-ink transition-colors"
            aria-expanded={commentsExpanded}
          >
            <MessageCircle size={14} />
            <span>
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </span>
            {commentsExpanded ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
        </div>
        {currentUser && (
          <ReportButton onReport={handleReport} hasReported={hasReported} />
        )}
      </div>

      {/* Comment Section (expandable) */}
      {commentsExpanded && (
        <PostCommentSection
          postId={post.id}
          currentUser={currentUser}
          onCommentCountChange={setCommentCount}
          onHideComments={() => setCommentsExpanded(false)}
        />
      )}
    </div>
  );
};

export default PostCard;
