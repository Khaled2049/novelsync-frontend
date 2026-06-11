export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  userId: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  userId: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  chapterCount: number;
  author: string;
  views: number;
  likes: number;
  coverImageUrl?: string;
  tags?: string[];
  category?: string;
  targetAudience?: string;
  language?: string;
  copyright?: string;
  averageRating?: number;
  ratingsCount?: number;
}

export interface StoryMetadata {
  id: string;
  title: string;
  description: string;
  chapterCount: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: string;
  views: number;
  likes: number;
  coverImageUrl?: string;
  tags?: string[];
  category?: string;
  targetAudience?: string;
  language?: string;
  copyright?: string;
  averageRating?: number;
  ratingsCount?: number;
  wordCount?: number;
}

export interface ILikes {
  storyId: string;
  likes: number;
  likedBy: string[];
}
