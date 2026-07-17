import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  BookOpen,
  Trash2,
  Flag,
  MoreHorizontal,
} from "lucide-react";
import { IPost } from "@/types/IPost";
import { IUser } from "@/types/IUser";
import { Link } from "react-router-dom";
import PostCommentSection from "./PostCommentSection";
import VoteButtons from "@/components/community/VoteButtons";
import ReportButton from "@/components/community/ReportButton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { voteService } from "@/services/VoteService";
import { reportService } from "@/services/ReportService";
import { postsService } from "@/services/PostService";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useAuthorUsername } from "@/hooks/queries/useUserQueries";
import { toast } from "sonner";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

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

    setIsDeleting(true);
    try {
      await postsService.deletePost(post.id, post.authorId);
      onPostDeleted?.(post.id);
      toast.success("Post deleted");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post. Please try again.");
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

  const authorUsername = useAuthorUsername(post.authorId, post.authorUsername);
  const initials = authorUsername.charAt(0).toUpperCase();
  const isAuthor = currentUser?.uid === post.authorId;

  const handleRowClick = (e: React.MouseEvent) => {
    // Ignore clicks on interactive elements or inside the comment section so
    // votes, menus, links and text selection keep working.
    if (
      (e.target as HTMLElement).closest(
        "a, button, textarea, input, [role='menu'], [data-no-rowclick]",
      )
    ) {
      return;
    }
    // Ignore click that is actually a text selection drag.
    if (window.getSelection()?.toString()) return;
    setCommentsExpanded(true);
  };

  return (
    <article
      onClick={handleRowClick}
      className="group bg-ns-surface border border-ns-border rounded-ns-lg px-[22px] py-5 mb-[18px] hover:bg-ns-surface-hover transition-colors cursor-pointer"
    >
      {/* Header: avatar + meta + overflow menu */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0 font-ui text-[13px] leading-tight">
          <div className="w-[34px] h-[34px] rounded-full bg-ns-accent flex items-center justify-center text-white font-ui font-semibold text-sm flex-shrink-0">
            {initials}
          </div>
          <Link
            to={`/profile/${post.authorId}`}
            onClick={(e) => e.stopPropagation()}
            className="font-semibold text-ns-ink truncate no-underline hover:text-ns-accent hover:underline transition-colors"
          >
            @{authorUsername}
          </Link>
          <span className="text-ns-ink-muted">·</span>
          <span className="text-ns-ink-muted">{formatDate(post.createdAt)}</span>
          {post.bookClubId && bookClubName && (
            <Link
              to={`/book-clubs/${post.bookClubId}`}
              className="flex items-center gap-1 text-ns-accent hover:text-ns-accent-hover transition-colors no-underline"
            >
              <BookOpen size={12} />
              <span className="truncate max-w-[10rem]">{bookClubName}</span>
            </Link>
          )}
        </div>

        {currentUser && (isAuthor || !hasReported) && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex-shrink-0 -mr-1 p-1.5 rounded-full text-ns-ink-muted hover:text-ns-ink hover:bg-ns-surface-hover transition-colors focus:outline-none disabled:opacity-40"
              disabled={isDeleting}
              aria-label="Post options"
            >
              <MoreHorizontal size={18} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {isAuthor ? (
                <DropdownMenuItem
                  onSelect={() => setShowDeleteConfirm(true)}
                  className="text-ns-destructive focus:text-ns-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  {isDeleting ? "Deleting…" : "Delete post"}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => setShowReportDialog(true)}>
                  <Flag size={14} className="mr-2" />
                  Report post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <p className="font-body text-ns-ink whitespace-pre-wrap break-words text-[17px] leading-[1.55] mb-3.5">
        {post.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 -ml-2">
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
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-ui text-xs transition-colors ${
            commentsExpanded
              ? "text-ns-accent bg-ns-accent-subtle"
              : "text-ns-ink-muted hover:text-ns-ink hover:bg-ns-surface-hover"
          }`}
          aria-expanded={commentsExpanded}
        >
          <MessageCircle size={15} />
          <span>{commentCount}</span>
        </button>
      </div>

      {/* Comment Section (expandable) */}
      {commentsExpanded && (
        <div data-no-rowclick>
          <PostCommentSection
            postId={post.id}
            currentUser={currentUser}
            onCommentCountChange={setCommentCount}
            onHideComments={() => setCommentsExpanded(false)}
          />
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete post?"
        description="This post and all its comments will be permanently deleted. This cannot be undone."
        confirmLabel="Delete post"
        cancelLabel="Keep post"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />

      {/* Report dialog (driven from the overflow menu) */}
      {currentUser && (
        <ReportButton
          onReport={handleReport}
          hasReported={hasReported}
          showTrigger={false}
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
        />
      )}
    </article>
  );
};

export default PostCard;
