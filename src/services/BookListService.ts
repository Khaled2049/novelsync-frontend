import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { IBookList, IBookListItem } from "@/types/IBookList";

class BookListService {
  private bookListsCollection = collection(firestore, "bookLists");

  /**
   * Create a new book list
   */
  async createBookList(
    userId: string,
    username: string,
    title: string,
    isPublic: boolean = true,
  ): Promise<string> {
    try {
      const newListRef = doc(this.bookListsCollection);
      const newList: Omit<IBookList, "id"> = {
        title: title.trim(),
        userId,
        username,
        books: [],
        isPublic,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      await setDoc(newListRef, newList);
      return newListRef.id;
    } catch (error) {
      console.error("Error creating book list:", error);
      throw error;
    }
  }

  /**
   * Get all book lists created by a specific user
   */
  async getUserBookLists(userId: string): Promise<IBookList[]> {
    try {
      const userListsQuery = query(
        this.bookListsCollection,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(userListsQuery);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          isPublic: data.isPublic !== undefined ? data.isPublic : true, // Default to public for backward compatibility
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          books: data.books || [],
        } as IBookList;
      });
    } catch (error) {
      console.error("Error getting user book lists:", error);
      throw error;
    }
  }

  /**
   * Get all public book lists (for viewing other users' lists)
   * Optionally include user's own lists even if private
   */
  async getAllBookLists(currentUserId?: string): Promise<IBookList[]> {
    try {
      // Unauthenticated users can only query public lists (matches security rule).
      // Authenticated users fetch all lists and filter in memory to include their own private lists.
      const allListsQuery = currentUserId
        ? query(this.bookListsCollection, orderBy("createdAt", "desc"))
        : query(
            this.bookListsCollection,
            where("isPublic", "==", true),
            orderBy("createdAt", "desc"),
          );

      const snapshot = await getDocs(allListsQuery);
      const allLists = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          isPublic: data.isPublic !== undefined ? data.isPublic : true, // Default to public for backward compatibility
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          books: data.books || [],
        } as IBookList;
      });

      // Filter to only public lists (or user's own lists if currentUserId provided)
      const publicLists = allLists.filter(
        (list) =>
          list.isPublic || (currentUserId && list.userId === currentUserId), // Include user's own private lists
      );

      return publicLists;
    } catch (error) {
      console.error("Error getting all book lists:", error);
      throw error;
    }
  }

  /**
   * Get a single book list by ID
   */
  async getBookList(listId: string): Promise<IBookList | null> {
    try {
      const listRef = doc(this.bookListsCollection, listId);
      const listDoc = await getDoc(listRef);

      if (!listDoc.exists()) {
        return null;
      }

      const data = listDoc.data();
      return {
        id: listDoc.id,
        ...data,
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        books: data.books || [],
      } as IBookList;
    } catch (error) {
      console.error("Error getting book list:", error);
      throw error;
    }
  }

  /**
   * Update a book list (title, isPublic, etc.)
   */
  async updateBookList(
    listId: string,
    userId: string,
    updates: Partial<Pick<IBookList, "title" | "isPublic">>,
  ): Promise<void> {
    try {
      // Verify ownership
      const list = await this.getBookList(listId);
      if (!list) {
        throw new Error("Book list not found");
      }
      if (list.userId !== userId) {
        throw new Error("User does not have permission to update this list");
      }

      const listRef = doc(this.bookListsCollection, listId);
      await updateDoc(listRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating book list:", error);
      throw error;
    }
  }

  /**
   * Update the privacy setting of a book list
   */
  async updateListPrivacy(
    listId: string,
    userId: string,
    isPublic: boolean,
  ): Promise<void> {
    try {
      await this.updateBookList(listId, userId, { isPublic });
    } catch (error) {
      console.error("Error updating list privacy:", error);
      throw error;
    }
  }

  /**
   * Delete a book list
   */
  async deleteBookList(listId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const list = await this.getBookList(listId);
      if (!list) {
        throw new Error("Book list not found");
      }
      if (list.userId !== userId) {
        throw new Error("User does not have permission to delete this list");
      }

      const listRef = doc(this.bookListsCollection, listId);
      await deleteDoc(listRef);
    } catch (error) {
      console.error("Error deleting book list:", error);
      throw error;
    }
  }

  /**
   * Add a book to a list
   */
  async addBookToList(
    listId: string,
    userId: string,
    book: IBookListItem,
  ): Promise<void> {
    try {
      // Verify ownership
      const list = await this.getBookList(listId);
      if (!list) {
        throw new Error("Book list not found");
      }
      if (list.userId !== userId) {
        throw new Error("User does not have permission to modify this list");
      }

      // Check if book already exists in list
      const bookExists = list.books.some((b) => b.id === book.id);
      if (bookExists) {
        throw new Error("Book already exists in this list");
      }

      // Add book to the array
      const updatedBooks = [...list.books, book];

      const listRef = doc(this.bookListsCollection, listId);
      await updateDoc(listRef, {
        books: updatedBooks,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding book to list:", error);
      throw error;
    }
  }

  /**
   * Remove a book from a list
   */
  async removeBookFromList(
    listId: string,
    userId: string,
    bookId: string,
  ): Promise<void> {
    try {
      // Verify ownership
      const list = await this.getBookList(listId);
      if (!list) {
        throw new Error("Book list not found");
      }
      if (list.userId !== userId) {
        throw new Error("User does not have permission to modify this list");
      }

      const updatedBooks = list.books.filter((b) => b.id !== bookId);
      if (updatedBooks.length === list.books.length) {
        throw new Error("Book not found in list");
      }

      const listRef = doc(this.bookListsCollection, listId);
      await updateDoc(listRef, {
        books: updatedBooks,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error removing book from list:", error);
      throw error;
    }
  }

  /**
   * Update the order of books in a list
   */
  async updateBookOrder(
    listId: string,
    userId: string,
    books: IBookListItem[],
  ): Promise<void> {
    try {
      // Verify ownership
      const list = await this.getBookList(listId);
      if (!list) {
        throw new Error("Book list not found");
      }
      if (list.userId !== userId) {
        throw new Error("User does not have permission to modify this list");
      }

      const listRef = doc(this.bookListsCollection, listId);
      await updateDoc(listRef, {
        books,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating book order:", error);
      throw error;
    }
  }
}

export const bookListService = new BookListService();
