export interface CommentLike {
  userId: string;
  commentId: string;
}

export interface Comment {
  id: string;
  storyId: string;
  chapterId: string;
  message: string;
  userId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  username?: string;
  user?: user;
  likes: CommentLike[];
  children?: Comment[];
}

type user = {
  uid: string;
  username: string;
};
