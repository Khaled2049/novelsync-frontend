import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Grid,
  List,
  Plus,
  X,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  BookOpen,
  Lock,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { bookListService } from "@/services/BookListService";
import { IBookList, IBookListItem } from "@/types/IBookList";
import axiosInstance from "@/api";

const BookLists = () => {
  const { user, loading: authLoading } = useAuthContext();
  const [bookLists, setBookLists] = useState<IBookList[]>([]);
  const [userBookLists, setUserBookLists] = useState<IBookList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"title" | "author" | "date">("title");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListIsPublic, setNewListIsPublic] = useState(true);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 12 items per page
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedList = bookLists.find((list) => list.id === selectedListId);

  // Fetch book lists on mount
  useEffect(() => {
    if (!authLoading && user) {
      fetchBookLists();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const fetchBookLists = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user's lists and all public lists (including user's private lists)
      const [userLists, allLists] = await Promise.all([
        bookListService.getUserBookLists(user.uid),
        bookListService.getAllBookLists(user.uid),
      ]);

      setUserBookLists(userLists);

      // Combine lists, prioritizing user's lists first
      const combinedLists = [
        ...userLists,
        ...allLists.filter(
          (list) => !userLists.some((ul) => ul.id === list.id)
        ),
      ];
      setBookLists(combinedLists);

      // Auto-select first list if available
      if (combinedLists.length > 0 && !selectedListId) {
        setSelectedListId(combinedLists[0].id);
      }
    } catch (err) {
      console.error("Error fetching book lists:", err);
      setError("Failed to load book lists. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Book search with debounce
  const searchBooks = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearchingBooks(true);
      const response = await axiosInstance.get("/searchBooks", {
        params: {
          q: query,
          maxResults: 10,
        },
      });
      setSearchResults(response.data.items || []);
    } catch (err) {
      console.error("Error searching books:", err);
      setError("Failed to search books. Please try again.");
    } finally {
      setIsSearchingBooks(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        searchBooks(query);
      }, 300);
    },
    [searchBooks]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Transform Google Books API result to IBookListItem
  const transformBookData = (book: any): IBookListItem => {
    const volumeInfo = book.volumeInfo || {};
    return {
      id: book.id,
      title: volumeInfo.title || "Unknown Title",
      author: volumeInfo.authors?.join(", ") || "Unknown Author",
      coverUrl:
        volumeInfo.imageLinks?.thumbnail ||
        volumeInfo.imageLinks?.smallThumbnail,
      publishedDate: volumeInfo.publishedDate,
      genre: volumeInfo.categories?.[0],
      volumeInfo: volumeInfo,
    };
  };

  // Get unique genres from all books in selected list
  const genres = selectedList
    ? [
        "all",
        ...new Set(
          selectedList.books
            .map((book) => book.genre)
            .filter((genre): genre is string => Boolean(genre))
        ),
      ]
    : ["all"];

  // Filter and sort books
  const getFilteredAndSortedBooks = (): IBookListItem[] => {
    if (!selectedList) return [];

    let filtered = selectedList.books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = filterGenre === "all" || book.genre === filterGenre;
      return matchesSearch && matchesGenre;
    });

    filtered.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "author") return a.author.localeCompare(b.author);
      if (sortBy === "date")
        return (a.publishedDate || "").localeCompare(b.publishedDate || "");
      return 0;
    });

    return filtered;
  };

  // Create new list
  const handleCreateList = async () => {
    if (!user || !newListName.trim()) return;

    try {
      setError(null);
      const listId = await bookListService.createBookList(
        user.uid,
        user.username || user.displayName || "Unknown User",
        newListName.trim(),
        newListIsPublic
      );

      // Refresh lists
      await fetchBookLists();

      setSelectedListId(listId);
      setNewListName("");
      setNewListIsPublic(true);
      setIsCreatingList(false);
    } catch (err: any) {
      console.error("Error creating list:", err);
      setError(err.message || "Failed to create list. Please try again.");
    }
  };

  // Toggle list privacy
  const handleTogglePrivacy = async (listId: string) => {
    if (!user) return;

    const list = bookLists.find((l) => l.id === listId);
    if (!list || list.userId !== user.uid) {
      setError("You can only change privacy of your own lists.");
      return;
    }

    try {
      setError(null);
      await bookListService.updateListPrivacy(listId, user.uid, !list.isPublic);

      // Refresh lists
      await fetchBookLists();
    } catch (err: any) {
      console.error("Error updating list privacy:", err);
      setError(
        err.message || "Failed to update list privacy. Please try again."
      );
    }
  };

  // Delete list
  const handleDeleteList = async (listId: string) => {
    if (!user) return;

    const list = bookLists.find((l) => l.id === listId);
    if (!list) return;

    // Check ownership
    if (list.userId !== user.uid) {
      setError("You can only delete your own lists.");
      return;
    }

    if (bookLists.length === 1) {
      setError("Cannot delete the last list");
      return;
    }

    if (!confirm("Are you sure you want to delete this list?")) {
      return;
    }

    try {
      setError(null);
      await bookListService.deleteBookList(listId, user.uid);

      // Refresh lists
      await fetchBookLists();

      // Select another list if current was deleted
      const remainingLists = bookLists.filter((l) => l.id !== listId);
      if (remainingLists.length > 0) {
        setSelectedListId(remainingLists[0].id);
      } else {
        setSelectedListId(null);
      }
    } catch (err: any) {
      console.error("Error deleting list:", err);
      setError(err.message || "Failed to delete list. Please try again.");
    }
  };

  // Rename list
  const handleRenameList = async (listId: string) => {
    if (!user || !editingListName.trim()) return;

    const list = bookLists.find((l) => l.id === listId);
    if (!list || list.userId !== user.uid) {
      setError("You can only rename your own lists.");
      return;
    }

    try {
      setError(null);
      await bookListService.updateBookList(listId, user.uid, {
        title: editingListName.trim(),
      });

      // Refresh lists
      await fetchBookLists();

      setEditingListId(null);
      setEditingListName("");
    } catch (err: any) {
      console.error("Error renaming list:", err);
      setError(err.message || "Failed to rename list. Please try again.");
    }
  };

  // Add book to list
  const handleAddBook = async (book: any) => {
    if (!user || !selectedListId) return;

    const list = bookLists.find((l) => l.id === selectedListId);
    if (!list || list.userId !== user.uid) {
      setError("You can only add books to your own lists.");
      return;
    }

    try {
      setError(null);
      const bookItem = transformBookData(book);
      await bookListService.addBookToList(selectedListId, user.uid, bookItem);

      // Refresh lists
      await fetchBookLists();

      setShowBookSearch(false);
      setBookSearchQuery("");
      setSearchResults([]);
    } catch (err: any) {
      console.error("Error adding book:", err);
      setError(err.message || "Failed to add book. Please try again.");
    }
  };

  // Remove book from list
  const handleRemoveBook = async (bookId: string) => {
    if (!user || !selectedListId) return;

    const list = bookLists.find((l) => l.id === selectedListId);
    if (!list || list.userId !== user.uid) {
      setError("You can only remove books from your own lists.");
      return;
    }

    if (!confirm("Remove this book from the list?")) {
      return;
    }

    try {
      setError(null);
      await bookListService.removeBookFromList(
        selectedListId,
        user.uid,
        bookId
      );

      // Refresh lists
      await fetchBookLists();
    } catch (err: any) {
      console.error("Error removing book:", err);
      setError(err.message || "Failed to remove book. Please try again.");
    }
  };

  // Move book between lists
  const handleMoveBook = async (bookId: string, targetListId: string) => {
    if (!user || !selectedListId) return;

    const sourceList = bookLists.find((l) => l.id === selectedListId);
    const targetList = bookLists.find((l) => l.id === targetListId);

    if (!sourceList || !targetList) return;

    // Both lists must be owned by user
    if (sourceList.userId !== user.uid || targetList.userId !== user.uid) {
      setError("You can only move books between your own lists.");
      return;
    }

    const book = sourceList.books.find((b) => b.id === bookId);
    if (!book) return;

    try {
      setError(null);

      // Remove from source list
      await bookListService.removeBookFromList(
        selectedListId,
        user.uid,
        bookId
      );

      // Add to target list
      await bookListService.addBookToList(targetListId, user.uid, book);

      // Refresh lists
      await fetchBookLists();
    } catch (err: any) {
      console.error("Error moving book:", err);
      setError(err.message || "Failed to move book. Please try again.");
    }
  };

  // Move book up/down in list
  const handleMoveBookPosition = async (
    bookId: string,
    direction: "up" | "down"
  ) => {
    if (!user || !selectedList) return;

    if (selectedList.userId !== user.uid) {
      setError("You can only reorder books in your own lists.");
      return;
    }

    const currentIndex = selectedList.books.findIndex((b) => b.id === bookId);
    if (currentIndex === -1) return;
    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === selectedList.books.length - 1)
      return;

    const newBooks = [...selectedList.books];
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    [newBooks[currentIndex], newBooks[targetIndex]] = [
      newBooks[targetIndex],
      newBooks[currentIndex],
    ];

    try {
      setError(null);
      await bookListService.updateBookOrder(
        selectedListId!,
        user.uid,
        newBooks
      );

      // Refresh lists
      await fetchBookLists();
    } catch (err: any) {
      console.error("Error reordering books:", err);
      setError(err.message || "Failed to reorder books. Please try again.");
    }
  };

  const filteredBooks = getFilteredAndSortedBooks();
  const isOwner = selectedList ? selectedList.userId === user?.uid : false;
  const userListsIds = new Set(userBookLists.map((l) => l.id));

  // Pagination calculations
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterGenre, sortBy, selectedListId]);

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2
          className="animate-spin text-dark-green dark:text-light-green"
          size={32}
        />
      </div>
    );
  }

  // Show auth required message
  if (!user) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <BookOpen
            className="mx-auto mb-4 text-gray-400 dark:text-gray-600"
            size={48}
          />
          <h2 className="text-2xl font-bold mb-2 text-black dark:text-white">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to create and manage book lists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-neutral-50 dark:bg-black">
      <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">
        Book Lists
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 float-right font-bold hover:text-red-900 dark:hover:text-red-200"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar - Lists */}
        <div className="w-64 flex-shrink-0">
          <div className="mb-4">
            <button
              onClick={() => setIsCreatingList(true)}
              className="w-full flex items-center gap-2 px-4 py-2 bg-dark-green dark:bg-light-green text-white rounded hover:opacity-90 transition-opacity"
            >
              <Plus size={18} /> New List
            </button>
          </div>

          {isCreatingList && (
            <div className="mb-4 p-3 border border-gray-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateList();
                  if (e.key === "Escape") {
                    setIsCreatingList(false);
                    setNewListName("");
                    setNewListIsPublic(true);
                  }
                }}
                placeholder="List name"
                className="w-full px-2 py-1 border border-gray-200 dark:border-neutral-700 rounded mb-2 bg-white dark:bg-neutral-900 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-dark-green dark:focus:border-light-green"
                autoFocus
              />
              <label className="flex items-center gap-2 mb-2 text-sm cursor-pointer text-black dark:text-white">
                <input
                  type="checkbox"
                  checked={newListIsPublic}
                  onChange={(e) => setNewListIsPublic(e.target.checked)}
                  className="cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <Globe
                    size={14}
                    className="text-dark-green dark:text-light-green"
                  />
                  Make public
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateList}
                  className="px-3 py-1 bg-dark-green dark:bg-light-green text-white rounded text-sm hover:opacity-90 transition-opacity"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreatingList(false);
                    setNewListName("");
                    setNewListIsPublic(true);
                  }}
                  className="px-3 py-1 bg-gray-300 dark:bg-neutral-700 text-black dark:text-white rounded text-sm hover:bg-gray-400 dark:hover:bg-neutral-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* My Lists Section */}
          {userBookLists.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                My Lists
              </h3>
              <div className="space-y-2">
                {userBookLists.map((list) => (
                  <div
                    key={list.id}
                    className={`p-3 rounded cursor-pointer border transition-colors ${
                      selectedListId === list.id
                        ? "bg-dark-green/10 dark:bg-light-green/20 border-dark-green dark:border-light-green"
                        : "border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900"
                    }`}
                  >
                    {editingListId === list.id ? (
                      <div>
                        <input
                          type="text"
                          value={editingListName}
                          onChange={(e) => setEditingListName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameList(list.id);
                            if (e.key === "Escape") {
                              setEditingListId(null);
                              setEditingListName("");
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-200 dark:border-neutral-700 rounded mb-2 bg-white dark:bg-neutral-900 text-black dark:text-white focus:outline-none focus:border-dark-green dark:focus:border-light-green"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRenameList(list.id)}
                            className="px-2 py-1 bg-dark-green dark:bg-light-green text-white rounded text-xs hover:opacity-90 transition-opacity"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingListId(null);
                              setEditingListName("");
                            }}
                            className="px-2 py-1 bg-gray-300 dark:bg-neutral-700 text-black dark:text-white rounded text-xs hover:bg-gray-400 dark:hover:bg-neutral-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div
                          onClick={() => setSelectedListId(list.id)}
                          className="flex justify-between items-start"
                        >
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-1 text-black dark:text-white">
                              {list.title}
                              {list.isPublic ? (
                                <span title="Public">
                                  <Globe
                                    size={14}
                                    className="text-dark-green dark:text-light-green"
                                  />
                                </span>
                              ) : (
                                <span title="Private">
                                  <Lock
                                    size={14}
                                    className="text-gray-500 dark:text-gray-400"
                                  />
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {list.books.length} books
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePrivacy(list.id);
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                              title={
                                list.isPublic ? "Make private" : "Make public"
                              }
                            >
                              {list.isPublic ? (
                                <Globe
                                  size={14}
                                  className="text-dark-green dark:text-light-green"
                                />
                              ) : (
                                <Lock
                                  size={14}
                                  className="text-gray-500 dark:text-gray-400"
                                />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingListId(list.id);
                                setEditingListName(list.title);
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                            >
                              <Edit2
                                size={14}
                                className="text-gray-600 dark:text-gray-400"
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteList(list.id);
                              }}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            >
                              <Trash2
                                size={14}
                                className="text-red-600 dark:text-red-400"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Users' Lists Section */}
          {bookLists.filter((l) => !userListsIds.has(l.id)).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Other Users' Lists
              </h3>
              <div className="space-y-2">
                {bookLists
                  .filter((l) => !userListsIds.has(l.id))
                  .map((list) => (
                    <div
                      key={list.id}
                      className={`p-3 rounded cursor-pointer border transition-colors ${
                        selectedListId === list.id
                          ? "bg-light-green/10 dark:bg-light-green/20 border-light-green dark:border-light-green"
                          : "border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900"
                      }`}
                      onClick={() => setSelectedListId(list.id)}
                    >
                      <div className="font-medium flex items-center gap-1 text-black dark:text-white">
                        {list.title}
                        {list.isPublic && (
                          <span title="Public">
                            <Globe
                              size={14}
                              className="text-dark-green dark:text-light-green"
                            />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        by {list.username}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {list.books.length} books
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {bookLists.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No book lists yet. Create your first list!
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {selectedList ? (
            <>
              {/* List Header */}
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-black dark:text-white">
                      {selectedList.title}
                      {selectedList.isPublic ? (
                        <span title="Public">
                          <Globe
                            size={20}
                            className="text-dark-green dark:text-light-green"
                          />
                        </span>
                      ) : (
                        <span title="Private">
                          <Lock
                            size={20}
                            className="text-gray-500 dark:text-gray-400"
                          />
                        </span>
                      )}
                    </h2>
                    {!isOwner && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        by {selectedList.username}
                      </p>
                    )}
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePrivacy(selectedList.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                          selectedList.isPublic
                            ? "bg-dark-green/10 dark:bg-light-green/20 text-dark-green dark:text-light-green hover:bg-dark-green/20 dark:hover:bg-light-green/30"
                            : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                        }`}
                        title={
                          selectedList.isPublic ? "Make private" : "Make public"
                        }
                      >
                        {selectedList.isPublic ? (
                          <>
                            <Globe size={16} />
                            <span>Public</span>
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            <span>Private</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowBookSearch(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-green dark:bg-light-green text-white rounded hover:opacity-90 transition-opacity"
                      >
                        <Plus size={18} /> Add Book
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Book Search Modal */}
              {showBookSearch && (
                <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-neutral-700">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-black dark:text-white">
                        Search Books
                      </h3>
                      <button
                        onClick={() => {
                          setShowBookSearch(false);
                          setBookSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>
                    <div className="mb-4">
                      <input
                        type="text"
                        value={bookSearchQuery}
                        onChange={(e) => {
                          setBookSearchQuery(e.target.value);
                          debouncedSearch(e.target.value);
                        }}
                        placeholder="Search for books..."
                        className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-dark-green dark:focus:border-light-green"
                      />
                    </div>
                    {isSearchingBooks && (
                      <div className="text-center py-4">
                        <Loader2
                          className="animate-spin mx-auto text-dark-green dark:text-light-green"
                          size={24}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      {searchResults.map((book) => (
                        <div
                          key={book.id}
                          className="flex items-center gap-4 p-3 border border-gray-200 dark:border-neutral-700 rounded hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                          onClick={() => handleAddBook(book)}
                        >
                          {book.volumeInfo?.imageLinks?.thumbnail && (
                            <img
                              src={book.volumeInfo.imageLinks.thumbnail}
                              alt={book.volumeInfo.title}
                              className="w-16 h-24 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-black dark:text-white">
                              {book.volumeInfo?.title || "Unknown Title"}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {book.volumeInfo?.authors?.join(", ") ||
                                "Unknown Author"}
                            </p>
                          </div>
                          <button className="px-3 py-1 bg-dark-green dark:bg-light-green text-white rounded text-sm hover:opacity-90 transition-opacity">
                            Add
                          </button>
                        </div>
                      ))}
                      {!isSearchingBooks &&
                        bookSearchQuery &&
                        searchResults.length === 0 && (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            No books found. Try a different search.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="mb-6 space-y-4">
                {/* Search */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search
                      className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"
                      size={20}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search books by title or author..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-dark-green dark:focus:border-light-green"
                    />
                  </div>
                </div>

                {/* Filters and View Toggle */}
                <div className="flex gap-4 items-center">
                  <div className="flex gap-2 items-center">
                    <label className="text-sm font-medium text-black dark:text-white">
                      Sort by:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as "title" | "author" | "date")
                      }
                      className="px-3 py-1 border border-gray-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-black dark:text-white focus:outline-none focus:border-dark-green dark:focus:border-light-green"
                    >
                      <option value="title">Title</option>
                      <option value="author">Author</option>
                      <option value="date">Date</option>
                    </select>
                  </div>

                  <div className="flex gap-2 items-center">
                    <label className="text-sm font-medium text-black dark:text-white">
                      Genre:
                    </label>
                    <select
                      value={filterGenre}
                      onChange={(e) => setFilterGenre(e.target.value)}
                      className="px-3 py-1 border border-gray-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-black dark:text-white focus:outline-none focus:border-dark-green dark:focus:border-light-green"
                    >
                      {genres.map((genre) => (
                        <option key={genre} value={genre}>
                          {genre === "all" ? "All Genres" : genre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded transition-colors ${
                        viewMode === "grid"
                          ? "bg-dark-green dark:bg-light-green text-white"
                          : "bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-600"
                      }`}
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded transition-colors ${
                        viewMode === "list"
                          ? "bg-dark-green dark:bg-light-green text-white"
                          : "bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-600"
                      }`}
                    >
                      <List size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Books Display */}
              {filteredBooks.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  {selectedList.books.length === 0
                    ? isOwner
                      ? "This list is empty. Add some books!"
                      : "This list is empty."
                    : "No books found. Try adjusting your search or filters."}
                </div>
              ) : viewMode === "grid" ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {paginatedBooks.map((book) => (
                      <div
                        key={book.id}
                        className="border rounded p-2 hover:shadow-md transition-shadow"
                      >
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="aspect-[2/3] w-full object-cover mb-2 rounded"
                          />
                        ) : (
                          <div className="aspect-[2/3] bg-gray-200 mb-2 flex items-center justify-center text-gray-400 rounded">
                            <BookOpen size={20} />
                          </div>
                        )}
                        <h3 className="font-semibold text-xs mb-1 line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                          {book.author}
                        </p>

                        {isOwner && (
                          <div className="flex gap-1 mt-2">
                            <select
                              onChange={(e) =>
                                handleMoveBook(book.id, e.target.value)
                              }
                              className="text-xs px-1 py-0.5 border border-gray-200 dark:border-neutral-700 rounded flex-1 text-[10px] bg-white dark:bg-neutral-900 text-black dark:text-white"
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Move...
                              </option>
                              {userBookLists
                                .filter((list) => list.id !== selectedListId)
                                .map((list) => (
                                  <option key={list.id} value={list.id}>
                                    {list.title}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => handleRemoveBook(book.id)}
                              className="p-0.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                              title="Remove book"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(
                            (page) =>
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 &&
                                page <= currentPage + 1)
                          )
                          .map((page, index, array) => {
                            const showEllipsis =
                              index > 0 && array[index - 1] !== page - 1;
                            return (
                              <span
                                key={page}
                                className="flex items-center gap-1"
                              >
                                {showEllipsis && (
                                  <span className="px-2">...</span>
                                )}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-3 py-1 border rounded ${
                                    currentPage === page
                                      ? "bg-blue-500 text-white"
                                      : "hover:bg-gray-100"
                                  }`}
                                >
                                  {page}
                                </button>
                              </span>
                            );
                          })}
                      </div>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <span className="text-sm text-gray-600 ml-2">
                        Page {currentPage} of {totalPages} (
                        {filteredBooks.length} books)
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    {paginatedBooks.map((book, index) => {
                      const actualIndex = startIndex + index;
                      return (
                        <div
                          key={book.id}
                          className="border border-gray-200 dark:border-neutral-700 rounded p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-4 transition-colors bg-white dark:bg-neutral-900"
                        >
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              className="w-10 h-14 object-cover flex-shrink-0 rounded"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-gray-200 dark:bg-neutral-800 flex-shrink-0 flex items-center justify-center text-xs text-gray-400 dark:text-gray-600 rounded">
                              <BookOpen size={16} />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm line-clamp-1 text-black dark:text-white">
                              {book.title}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                              {book.author}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {book.publishedDate}{" "}
                              {book.genre && `• ${book.genre}`}
                            </p>
                          </div>

                          {isOwner && (
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() =>
                                    handleMoveBookPosition(book.id, "up")
                                  }
                                  disabled={actualIndex === 0}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded disabled:opacity-30 transition-colors text-gray-600 dark:text-gray-400"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleMoveBookPosition(book.id, "down")
                                  }
                                  disabled={
                                    actualIndex === filteredBooks.length - 1
                                  }
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded disabled:opacity-30 transition-colors text-gray-600 dark:text-gray-400"
                                >
                                  <ChevronDown size={14} />
                                </button>
                              </div>

                              <select
                                onChange={(e) =>
                                  handleMoveBook(book.id, e.target.value)
                                }
                                className="text-sm px-3 py-1 border border-gray-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-black dark:text-white focus:outline-none focus:border-dark-green dark:focus:border-light-green"
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  Move to...
                                </option>
                                {userBookLists
                                  .filter((list) => list.id !== selectedListId)
                                  .map((list) => (
                                    <option key={list.id} value={list.id}>
                                      {list.title}
                                    </option>
                                  ))}
                              </select>

                              <button
                                onClick={() => handleRemoveBook(book.id)}
                                className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-200 dark:border-neutral-700 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-neutral-900 text-black dark:text-white transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(
                            (page) =>
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 &&
                                page <= currentPage + 1)
                          )
                          .map((page, index, array) => {
                            const showEllipsis =
                              index > 0 && array[index - 1] !== page - 1;
                            return (
                              <span
                                key={page}
                                className="flex items-center gap-1"
                              >
                                {showEllipsis && (
                                  <span className="px-2 text-gray-600 dark:text-gray-400">
                                    ...
                                  </span>
                                )}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-3 py-1 border border-gray-200 dark:border-neutral-700 rounded transition-colors ${
                                    currentPage === page
                                      ? "bg-dark-green dark:bg-light-green text-white"
                                      : "hover:bg-gray-100 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900 text-black dark:text-white"
                                  }`}
                                >
                                  {page}
                                </button>
                              </span>
                            );
                          })}
                      </div>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-200 dark:border-neutral-700 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-neutral-900 text-black dark:text-white transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        Page {currentPage} of {totalPages} (
                        {filteredBooks.length} books)
                      </span>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Select a book list to view its contents.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookLists;
