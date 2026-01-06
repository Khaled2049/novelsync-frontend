import { Timestamp } from "firebase/firestore";

export interface IBookListItem {
  id: string; // Google Books volumeId
  title: string;
  author: string; // From authors array, joined
  coverUrl?: string; // From imageLinks.thumbnail
  publishedDate?: string;
  genre?: string;
  volumeInfo?: any; // Full Google Books volumeInfo for reference
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
