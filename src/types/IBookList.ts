import { Timestamp } from "firebase/firestore";

export interface IBookListItem {
  id: string; // Platform story ID
  title: string;
  author: string;
  coverUrl?: string;
  genre?: string; // Mapped from story category
  chapterCount?: number;
  description?: string;
}

export interface IBookList {
  id: string;
  title: string;
  userId: string; // Creator's UID
  username: string; // Creator's username
  books: IBookListItem[];
  isPublic: boolean; // Whether the list is visible to other users
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
