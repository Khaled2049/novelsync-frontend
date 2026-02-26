import React from "react";
import { CommentInput } from "@/components/CommentInput";
import { CommentList } from "@/components/CommentList";
import { Comment as IComment } from "@/types/IComment";
import { IUser } from "@/types/IUser";

interface StoryCommentsSectionProps {
  storyId: string;
  chapterId: string;
  comments: IComment[];
  commentsLoading: boolean;
  currentUser: IUser | null;
  onLike: (commentId: string) => Promise<void>;
  onReply: (parentId: string, message: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onEdit: (commentId: string, newMessage: string) => Promise<void>;
}

export const StoryCommentsSection: React.FC<StoryCommentsSectionProps> = ({
  storyId,
  chapterId,
  comments,
  commentsLoading,
  currentUser,
  onLike,
  onReply,
  onDelete,
  onEdit,
}) => {
  return (
    <section>
      <div className="flex items-center gap-3 mb-8">
        <h3 className="font-heading italic text-2xl text-ns-ink">
          Community Reviews
        </h3>
        {comments.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-ns-accent-subtle font-ui text-[10px] font-semibold text-ns-accent">
            {comments.length}
          </span>
        )}
      </div>

      {currentUser && (
        <div className="mb-10">
          <CommentInput
            storyId={storyId}
            chapterId={chapterId}
            currentUser={currentUser}
          />
        </div>
      )}

      {commentsLoading ? (
        <div className="py-10 text-center font-ui text-xs text-ns-ink-muted animate-pulse">
          Loading community thoughts…
        </div>
      ) : (
        <CommentList
          comments={comments}
          currentUser={currentUser}
          onLike={onLike}
          onReply={onReply}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      )}
    </section>
  );
};
