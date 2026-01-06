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
        <h3 className="text-2xl font-bold text-black dark:text-white">
          Community Reviews
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-medium text-black/60 dark:text-white/60">
          {comments.length}
        </span>
      </div>

      {/* Reusing existing Comment Components */}
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
        <div className="py-10 text-center opacity-50">
          Loading community thoughts...
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
