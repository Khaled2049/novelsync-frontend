import { useState, useEffect, useCallback } from "react";
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
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { bookListService } from "@/services/BookListService";
import { storiesRepo } from "@/services/StoriesRepo";
import { IBookList, IBookListItem } from "@/types/IBookList";
import { StoryMetadata } from "@/types/IStory";

// ─── Helpers ────────────────────────────────────────────────────────────────

const VisibilityBadge = ({
  isPublic,
  size = "sm",
}: {
  isPublic: boolean;
  size?: "xs" | "sm";
}) => {
  const base =
    size === "xs"
      ? "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-ui font-semibold"
      : "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-ui font-semibold";
  return isPublic ? (
    <span className={`${base} bg-ns-accent/10 text-ns-accent`}>
      <Globe className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      Public
    </span>
  ) : (
    <span
      className={`${base} bg-ns-surface text-ns-ink-muted border border-ns-border`}
    >
      <Lock className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      Private
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const BookLists = () => {
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [bookLists, setBookLists] = useState<IBookList[]>([]);
  const [userBookLists, setUserBookLists] = useState<IBookList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"title" | "author" | "chapters">(
    "title",
  );
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListIsPublic, setNewListIsPublic] = useState(true);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [platformStories, setPlatformStories] = useState<StoryMetadata[]>([]);
  const [platformLoading, setPlatformLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const selectedList = bookLists.find((l) => l.id === selectedListId);

  useEffect(() => {
    if (!authLoading) fetchBookLists();
  }, [authLoading, user]);

  useEffect(() => {
    if (showBookSearch && platformStories.length === 0) {
      setPlatformLoading(true);
      storiesRepo
        .getPublishedStories()
        .then(setPlatformStories)
        .catch(() => setError("Failed to load stories."))
        .finally(() => setPlatformLoading(false));
    }
  }, [showBookSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterGenre, sortBy, selectedListId]);

  const fetchBookLists = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user) {
        const [userLists, allLists] = await Promise.all([
          bookListService.getUserBookLists(user.uid),
          bookListService.getAllBookLists(user.uid),
        ]);
        setUserBookLists(userLists);
        const combined = [
          ...userLists,
          ...allLists.filter((l) => !userLists.some((ul) => ul.id === l.id)),
        ];
        setBookLists(combined);
        if (combined.length > 0 && !selectedListId)
          setSelectedListId(combined[0].id);
      } else {
        const allLists = await bookListService.getAllBookLists("");
        setBookLists(allLists);
        if (allLists.length > 0 && !selectedListId)
          setSelectedListId(allLists[0].id);
      }
    } catch {
      setError("Failed to load book lists.");
    } finally {
      setLoading(false);
    }
  };

  const transformStoryData = (story: StoryMetadata): IBookListItem => {
    const item: IBookListItem = {
      id: story.id,
      title: story.title,
      author: story.author,
    };
    if (story.coverImageUrl) item.coverUrl = story.coverImageUrl;
    if (story.category) item.genre = story.category;
    if (story.chapterCount !== undefined)
      item.chapterCount = story.chapterCount;
    if (story.description) item.description = story.description;
    return item;
  };

  const filteredPlatformStories = useCallback((): StoryMetadata[] => {
    const q = bookSearchQuery.toLowerCase().trim();
    if (!q) return platformStories;
    return platformStories.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q),
    );
  }, [platformStories, bookSearchQuery]);

  const genres = selectedList
    ? [
        "all",
        ...new Set(
          selectedList.books
            .map((b) => b.genre)
            .filter((g): g is string => Boolean(g)),
        ),
      ]
    : ["all"];

  const getFilteredAndSortedBooks = (): IBookListItem[] => {
    if (!selectedList) return [];
    let filtered = selectedList.books.filter((b) => {
      const q = searchQuery.toLowerCase();
      return (
        (b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)) &&
        (filterGenre === "all" || b.genre === filterGenre)
      );
    });
    filtered.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "author") return a.author.localeCompare(b.author);
      if (sortBy === "chapters")
        return (b.chapterCount ?? 0) - (a.chapterCount ?? 0);
      return 0;
    });
    return filtered;
  };

  // ── Mutations ────────────────────────────────────────────────────────────

  const handleCreateList = async () => {
    if (!user || !newListName.trim()) return;
    try {
      setError(null);
      const listId = await bookListService.createBookList(
        user.uid,
        user.username || user.displayName || "Unknown User",
        newListName.trim(),
        newListIsPublic,
      );
      await fetchBookLists();
      setSelectedListId(listId);
      setNewListName("");
      setNewListIsPublic(true);
      setIsCreatingList(false);
    } catch (err: any) {
      setError(err.message || "Failed to create list.");
    }
  };

  const handleTogglePrivacy = async (listId: string) => {
    if (!user) return;
    const list = bookLists.find((l) => l.id === listId);
    if (!list || list.userId !== user.uid) return;
    try {
      setError(null);
      await bookListService.updateListPrivacy(listId, user.uid, !list.isPublic);
      await fetchBookLists();
    } catch (err: any) {
      setError(err.message || "Failed to update privacy.");
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!user) return;
    const list = bookLists.find((l) => l.id === listId);
    if (!list || list.userId !== user.uid) return;
    if (bookLists.length === 1) {
      setError("Cannot delete the last list.");
      return;
    }
    if (!confirm("Delete this list?")) return;
    try {
      setError(null);
      await bookListService.deleteBookList(listId, user.uid);
      await fetchBookLists();
      const remaining = bookLists.filter((l) => l.id !== listId);
      setSelectedListId(remaining.length > 0 ? remaining[0].id : null);
    } catch (err: any) {
      setError(err.message || "Failed to delete list.");
    }
  };

  const handleRenameList = async (listId: string) => {
    if (!user || !editingListName.trim()) return;
    const list = bookLists.find((l) => l.id === listId);
    if (!list || list.userId !== user.uid) return;
    try {
      setError(null);
      await bookListService.updateBookList(listId, user.uid, {
        title: editingListName.trim(),
      });
      await fetchBookLists();
      setEditingListId(null);
      setEditingListName("");
    } catch (err: any) {
      setError(err.message || "Failed to rename list.");
    }
  };

  const handleAddStory = async (story: StoryMetadata) => {
    if (!user || !selectedListId) return;
    const list = bookLists.find((l) => l.id === selectedListId);
    if (!list || list.userId !== user.uid) {
      setError("You can only add stories to your own lists.");
      return;
    }
    if (list.books.some((b) => b.id === story.id)) {
      setError("Already in this list.");
      return;
    }
    try {
      setError(null);
      await bookListService.addBookToList(
        selectedListId,
        user.uid,
        transformStoryData(story),
      );
      await fetchBookLists();
      setShowBookSearch(false);
      setBookSearchQuery("");
    } catch (err: any) {
      setError(err.message || "Failed to add story.");
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    if (!user || !selectedListId) return;
    const list = bookLists.find((l) => l.id === selectedListId);
    if (!list || list.userId !== user.uid) return;
    if (!confirm("Remove this story from the list?")) return;
    try {
      setError(null);
      await bookListService.removeBookFromList(
        selectedListId,
        user.uid,
        bookId,
      );
      await fetchBookLists();
    } catch (err: any) {
      setError(err.message || "Failed to remove story.");
    }
  };

  const handleMoveBookPosition = async (
    bookId: string,
    direction: "up" | "down",
  ) => {
    if (!user || !selectedList || selectedList.userId !== user.uid) return;
    const idx = selectedList.books.findIndex((b) => b.id === bookId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === selectedList.books.length - 1) return;
    const newBooks = [...selectedList.books];
    const target = direction === "up" ? idx - 1 : idx + 1;
    [newBooks[idx], newBooks[target]] = [newBooks[target], newBooks[idx]];
    try {
      setError(null);
      await bookListService.updateBookOrder(
        selectedListId!,
        user.uid,
        newBooks,
      );
      await fetchBookLists();
    } catch (err: any) {
      setError(err.message || "Failed to reorder.");
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const filteredBooks = getFilteredAndSortedBooks();
  const isOwner = selectedList?.userId === user?.uid;
  const userListsIds = new Set(userBookLists.map((l) => l.id));
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBooks = filteredBooks.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  const otherLists = bookLists.filter((l) => !userListsIds.has(l.id));

  // ── States ───────────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-ns-accent" size={28} />
      </div>
    );
  }

  return (
    <div className="text-ns-ink">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Page title */}
        <h1 className="font-heading text-display text-ns-ink leading-none mb-8">
          Reading Lists
        </h1>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-ns-destructive/10 border border-ns-destructive/30 text-ns-destructive rounded-ns text-sm font-ui">
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* ── Sidebar ── */}
          <aside className="w-60 flex-shrink-0 space-y-6">
            {/* New list button */}
            {user && (
              <button
                onClick={() => setIsCreatingList(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-ns-accent hover:bg-ns-accent-hover text-white text-sm font-ui font-medium rounded-ns transition-colors"
              >
                <Plus className="w-4 h-4" />
                New List
              </button>
            )}

            {/* Create form */}
            {isCreatingList && (
              <div className="p-4 bg-ns-elevated border border-ns-border rounded-ns-lg space-y-3">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateList();
                    if (e.key === "Escape") {
                      setIsCreatingList(false);
                      setNewListName("");
                    }
                  }}
                  placeholder="List name"
                  className="w-full px-3 py-1.5 text-sm font-ui bg-ns-surface border border-ns-border rounded-ns text-ns-ink placeholder-ns-ink-muted focus:outline-none focus:ring-1 focus:ring-ns-accent focus:border-ns-accent"
                  autoFocus
                />
                {/* Visibility toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewListIsPublic(true)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-ns text-xs font-ui font-medium transition-colors border ${
                      newListIsPublic
                        ? "bg-ns-accent/10 border-ns-accent text-ns-accent"
                        : "bg-ns-surface border-ns-border text-ns-ink-muted hover:bg-ns-surface-hover"
                    }`}
                  >
                    <Globe className="w-3 h-3" /> Public
                  </button>
                  <button
                    onClick={() => setNewListIsPublic(false)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-ns text-xs font-ui font-medium transition-colors border ${
                      !newListIsPublic
                        ? "bg-ns-surface-hover border-ns-border-strong text-ns-ink"
                        : "bg-ns-surface border-ns-border text-ns-ink-muted hover:bg-ns-surface-hover"
                    }`}
                  >
                    <Lock className="w-3 h-3" /> Private
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateList}
                    className="flex-1 py-1.5 bg-ns-accent hover:bg-ns-accent-hover text-white rounded-ns text-xs font-ui font-medium transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingList(false);
                      setNewListName("");
                      setNewListIsPublic(true);
                    }}
                    className="flex-1 py-1.5 bg-ns-surface hover:bg-ns-surface-hover border border-ns-border text-ns-ink rounded-ns text-xs font-ui transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* My Lists */}
            {userBookLists.length > 0 && (
              <div>
                <p className="text-[10px] font-ui font-semibold uppercase tracking-widest text-ns-ink-muted mb-2 px-1">
                  My Lists
                </p>
                <div className="space-y-1">
                  {userBookLists.map((list) => (
                    <ListItem
                      key={list.id}
                      list={list}
                      isSelected={selectedListId === list.id}
                      isEditing={editingListId === list.id}
                      editingName={editingListName}
                      onSelect={() => setSelectedListId(list.id)}
                      onEditStart={() => {
                        setEditingListId(list.id);
                        setEditingListName(list.title);
                      }}
                      onEditChange={setEditingListName}
                      onEditSave={() => handleRenameList(list.id)}
                      onEditCancel={() => {
                        setEditingListId(null);
                        setEditingListName("");
                      }}
                      onDelete={() => handleDeleteList(list.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other users' lists */}
            {otherLists.length > 0 && (
              <div>
                <p className="text-[10px] font-ui font-semibold uppercase tracking-widest text-ns-ink-muted mb-2 px-1">
                  Community Lists
                </p>
                <div className="space-y-1">
                  {otherLists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => setSelectedListId(list.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-ns transition-colors ${
                        selectedListId === list.id
                          ? "bg-ns-surface-hover"
                          : "hover:bg-ns-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span
                          className={`text-sm font-ui font-medium truncate ${
                            selectedListId === list.id
                              ? "text-ns-ink"
                              : "text-ns-ink-secondary"
                          }`}
                        >
                          {list.title}
                        </span>
                        <VisibilityBadge isPublic={list.isPublic} size="xs" />
                      </div>
                      <p className="text-xs font-ui text-ns-ink-muted truncate">
                        by {list.username} · {list.books.length} stories
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bookLists.length === 0 && (
              <p className="text-sm font-ui text-ns-ink-muted text-center py-4">
                No lists yet. Create your first!
              </p>
            )}
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {selectedList ? (
              <>
                {/* List header */}
                <div className="mb-6 pb-5 border-b border-ns-border">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="font-heading text-3xl text-ns-ink leading-none">
                          {selectedList.title}
                        </h2>
                        <VisibilityBadge isPublic={selectedList.isPublic} />
                      </div>
                      <p className="mt-1.5 text-sm font-ui text-ns-ink-muted">
                        {!isOwner && `by ${selectedList.username} · `}
                        {selectedList.books.length}{" "}
                        {selectedList.books.length === 1 ? "story" : "stories"}
                      </p>
                    </div>

                    {isOwner && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Privacy toggle */}
                        <button
                          onClick={() => handleTogglePrivacy(selectedList.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-ui font-medium border border-ns-border rounded-ns bg-ns-surface hover:bg-ns-surface-hover text-ns-ink transition-colors"
                          title={
                            selectedList.isPublic
                              ? "Make private"
                              : "Make public"
                          }
                        >
                          {selectedList.isPublic ? (
                            <>
                              <Globe className="w-3.5 h-3.5 text-ns-accent" />{" "}
                              Make private
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-ns-ink-muted" />{" "}
                              Make public
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowBookSearch(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-ui font-medium bg-ns-accent hover:bg-ns-accent-hover text-white rounded-ns transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Story
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ns-ink-muted pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search stories…"
                      className="w-full pl-9 pr-4 py-2 text-sm font-ui bg-ns-surface border border-ns-border rounded-ns text-ns-ink placeholder-ns-ink-muted focus:outline-none focus:ring-1 focus:ring-ns-accent focus:border-ns-accent transition-colors"
                    />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as "title" | "author" | "chapters",
                      )
                    }
                    className="px-3 py-2 text-sm font-ui bg-ns-surface border border-ns-border rounded-ns text-ns-ink focus:outline-none focus:ring-1 focus:ring-ns-accent cursor-pointer"
                  >
                    <option value="title">Sort: Title</option>
                    <option value="author">Sort: Author</option>
                    <option value="chapters">Sort: Chapters</option>
                  </select>
                  {genres.length > 1 && (
                    <select
                      value={filterGenre}
                      onChange={(e) => setFilterGenre(e.target.value)}
                      className="px-3 py-2 text-sm font-ui bg-ns-surface border border-ns-border rounded-ns text-ns-ink focus:outline-none focus:ring-1 focus:ring-ns-accent cursor-pointer"
                    >
                      {genres.map((g) => (
                        <option key={g} value={g}>
                          {g === "all" ? "All categories" : g}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex gap-1">
                    {(["grid", "list"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`p-2 rounded-ns transition-colors ${
                          viewMode === mode
                            ? "bg-ns-accent text-white"
                            : "bg-ns-surface border border-ns-border text-ns-ink-muted hover:bg-ns-surface-hover"
                        }`}
                      >
                        {mode === "grid" ? (
                          <Grid size={16} />
                        ) : (
                          <List size={16} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Empty state */}
                {filteredBooks.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-ns-surface border border-ns-border flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-ns-ink-muted" />
                    </div>
                    <p className="font-ui text-sm text-ns-ink-secondary">
                      {selectedList.books.length === 0
                        ? isOwner
                          ? "This list is empty. Add some stories!"
                          : "This list is empty."
                        : "No stories match your search."}
                    </p>
                  </div>
                )}

                {/* Grid view */}
                {filteredBooks.length > 0 && viewMode === "grid" && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {paginatedBooks.map((book) => (
                        <div key={book.id} className="group relative">
                          <div
                            onClick={() => navigate(`/story/${book.id}`)}
                            className="aspect-[2/3] rounded-ns overflow-hidden bg-ns-surface border border-ns-border mb-2 cursor-pointer"
                          >
                            {book.coverUrl ? (
                              <img
                                src={book.coverUrl}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-ns-ink-muted">
                                <BookOpen className="w-8 h-8" />
                              </div>
                            )}
                            {/* Remove overlay */}
                            {isOwner && (
                              <button
                                onClick={() => handleRemoveBook(book.id)}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-ns-destructive"
                                title="Remove"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p
                            onClick={() => navigate(`/story/${book.id}`)}
                            className="text-xs font-ui font-medium text-ns-ink line-clamp-2 leading-snug cursor-pointer hover:text-ns-accent transition-colors"
                          >
                            {book.title}
                          </p>
                          <p className="text-[11px] font-ui text-ns-ink-muted mt-0.5 line-clamp-1">
                            {book.author}
                          </p>
                          {book.chapterCount !== undefined && (
                            <p className="text-[11px] font-ui text-ns-ink-muted">
                              {book.chapterCount}{" "}
                              {book.chapterCount === 1 ? "ch." : "chs."}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredBooks.length}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </>
                )}

                {/* List view */}
                {filteredBooks.length > 0 && viewMode === "list" && (
                  <>
                    <div className="divide-y divide-ns-border">
                      {paginatedBooks.map((book, index) => {
                        const actualIndex = startIndex + index;
                        return (
                          <div
                            key={book.id}
                            className="flex items-center gap-4 py-4 group"
                          >
                            {/* Cover */}
                            <div
                              onClick={() => navigate(`/story/${book.id}`)}
                              className="w-10 h-14 flex-shrink-0 rounded bg-ns-surface border border-ns-border overflow-hidden cursor-pointer"
                            >
                              {book.coverUrl ? (
                                <img
                                  src={book.coverUrl}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-ns-ink-muted">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div
                              onClick={() => navigate(`/story/${book.id}`)}
                              className="flex-1 min-w-0 cursor-pointer"
                            >
                              <p className="text-sm font-ui font-medium text-ns-ink line-clamp-1 hover:text-ns-accent transition-colors">
                                {book.title}
                              </p>
                              <p className="text-xs font-ui text-ns-ink-muted mt-0.5">
                                by {book.author}
                                {book.chapterCount !== undefined &&
                                  ` · ${book.chapterCount} ${book.chapterCount === 1 ? "chapter" : "chapters"}`}
                                {book.genre && ` · ${book.genre}`}
                              </p>
                            </div>

                            {/* Owner controls */}
                            {isOwner && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() =>
                                    handleMoveBookPosition(book.id, "up")
                                  }
                                  disabled={actualIndex === 0}
                                  className="p-1.5 rounded-ns hover:bg-ns-surface-hover disabled:opacity-30 transition-colors text-ns-ink-muted"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleMoveBookPosition(book.id, "down")
                                  }
                                  disabled={
                                    actualIndex === filteredBooks.length - 1
                                  }
                                  className="p-1.5 rounded-ns hover:bg-ns-surface-hover disabled:opacity-30 transition-colors text-ns-ink-muted"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoveBook(book.id)}
                                  className="p-1.5 rounded-ns hover:bg-ns-destructive/10 text-ns-ink-muted hover:text-ns-destructive transition-colors ml-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredBooks.length}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 mb-6 rounded-full bg-ns-surface border border-ns-border flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-ns-ink-muted" />
                </div>
                <p className="font-ui text-sm text-ns-ink-secondary">
                  Select a list to view its stories.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Story Modal ── */}
      {showBookSearch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60"
          onClick={() => {
            setShowBookSearch(false);
            setBookSearchQuery("");
          }}
        >
          <div
            className="w-full max-w-xl mx-4 bg-ns-elevated rounded-ns-xl shadow-ns-xl flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-ns-border">
              <h3 className="font-heading text-xl text-ns-ink">Add Story</h3>
              <button
                onClick={() => {
                  setShowBookSearch(false);
                  setBookSearchQuery("");
                }}
                className="p-1.5 rounded-ns text-ns-ink-muted hover:text-ns-ink hover:bg-ns-surface-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search input */}
            <div className="px-6 py-3 border-b border-ns-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ns-ink-muted pointer-events-none" />
                <input
                  type="text"
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  placeholder="Search by title, author, or category…"
                  className="w-full pl-9 pr-4 py-2 text-sm font-ui bg-ns-surface border border-ns-border rounded-ns text-ns-ink placeholder-ns-ink-muted focus:outline-none focus:ring-1 focus:ring-ns-accent focus:border-ns-accent transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto flex-1 px-2 py-2">
              {platformLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-ns-accent" size={24} />
                </div>
              ) : filteredPlatformStories().length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-ui text-sm text-ns-ink-secondary">
                    {bookSearchQuery
                      ? "No stories found."
                      : "No published stories available."}
                  </p>
                </div>
              ) : (
                filteredPlatformStories().map((story) => {
                  const added =
                    selectedList?.books.some((b) => b.id === story.id) ?? false;
                  return (
                    <button
                      key={story.id}
                      onClick={() => !added && handleAddStory(story)}
                      disabled={added}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-ns text-left transition-colors ${
                        added
                          ? "opacity-50 cursor-default"
                          : "hover:bg-ns-surface-hover"
                      }`}
                    >
                      <div className="w-9 h-12 flex-shrink-0 rounded bg-ns-surface border border-ns-border overflow-hidden">
                        {story.coverImageUrl ? (
                          <img
                            src={story.coverImageUrl}
                            alt={story.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ns-ink-muted">
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-ui font-medium text-ns-ink line-clamp-1">
                          {story.title}
                        </p>
                        <p className="text-xs font-ui text-ns-ink-muted">
                          by {story.author}
                          {story.chapterCount !== undefined &&
                            ` · ${story.chapterCount} ${story.chapterCount === 1 ? "chapter" : "chapters"}`}
                          {story.category && ` · ${story.category}`}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-ui font-medium transition-colors ${
                          added
                            ? "bg-ns-surface text-ns-ink-muted border border-ns-border"
                            : "bg-ns-accent/10 text-ns-accent border border-ns-accent/20 hover:bg-ns-accent hover:text-white"
                        }`}
                      >
                        {added ? (
                          <>
                            <Check className="w-3 h-3" /> Added
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" /> Add
                          </>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── List Item (sidebar) ─────────────────────────────────────────────────────

interface ListItemProps {
  list: IBookList;
  isSelected: boolean;
  isEditing: boolean;
  editingName: string;
  onSelect: () => void;
  onEditStart: () => void;
  onEditChange: (v: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
}

const ListItem = ({
  list,
  isSelected,
  isEditing,
  editingName,
  onSelect,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDelete,
}: ListItemProps) => {
  if (isEditing) {
    return (
      <div className="px-3 py-2 rounded-ns bg-ns-surface-hover border border-ns-border space-y-2">
        <input
          type="text"
          value={editingName}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEditSave();
            if (e.key === "Escape") onEditCancel();
          }}
          className="w-full px-2 py-1 text-sm font-ui bg-ns-surface border border-ns-border rounded-ns text-ns-ink focus:outline-none focus:ring-1 focus:ring-ns-accent"
          autoFocus
        />
        <div className="flex gap-1.5">
          <button
            onClick={onEditSave}
            className="flex-1 py-1 text-xs font-ui font-medium bg-ns-accent hover:bg-ns-accent-hover text-white rounded-ns transition-colors"
          >
            Save
          </button>
          <button
            onClick={onEditCancel}
            className="flex-1 py-1 text-xs font-ui bg-ns-surface hover:bg-ns-surface-hover border border-ns-border text-ns-ink rounded-ns transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex items-center gap-0 rounded-ns transition-colors overflow-hidden ${
        isSelected ? "bg-ns-surface-hover" : "hover:bg-ns-surface"
      }`}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-2 bottom-2 w-[2px] rounded-full transition-colors ${
          isSelected
            ? list.isPublic
              ? "bg-ns-accent"
              : "bg-ns-border-strong"
            : "bg-transparent"
        }`}
      />

      <button
        onClick={onSelect}
        className="flex-1 text-left pl-4 pr-2 py-2.5 min-w-0"
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`text-sm font-ui font-medium truncate ${
              isSelected ? "text-ns-ink" : "text-ns-ink-secondary"
            }`}
          >
            {list.title}
          </span>
          {/* Visibility dot */}
          <span
            className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${
              list.isPublic ? "bg-ns-accent" : "bg-ns-ink-muted"
            }`}
            title={list.isPublic ? "Public" : "Private"}
          />
        </div>
        <p className="text-[11px] font-ui text-ns-ink-muted">
          {list.isPublic ? "Public" : "Private"} · {list.books.length}{" "}
          {list.books.length === 1 ? "story" : "stories"}
        </p>
      </button>

      {/* Actions */}
      <div className="flex gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditStart();
          }}
          className="p-1.5 rounded-ns text-ns-ink-muted hover:text-ns-ink hover:bg-ns-surface-hover transition-colors"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-ns text-ns-ink-muted hover:text-ns-destructive hover:bg-ns-destructive/10 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// ─── Pagination ──────────────────────────────────────────────────────────────

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (p: number) => void;
}) => (
  <div className="mt-8 flex items-center justify-center gap-1.5">
    <button
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage === 1}
      className="p-2 rounded-ns border border-ns-border bg-ns-surface hover:bg-ns-surface-hover text-ns-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>

    {Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(
        (p) =>
          p === 1 ||
          p === totalPages ||
          (p >= currentPage - 1 && p <= currentPage + 1),
      )
      .map((p, i, arr) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && arr[i - 1] !== p - 1 && (
            <span className="px-1 text-ns-ink-muted text-sm">…</span>
          )}
          <button
            onClick={() => onPageChange(p)}
            className={`min-w-[32px] h-8 px-2 rounded-ns text-sm font-ui transition-colors border ${
              currentPage === p
                ? "bg-ns-accent text-white border-ns-accent"
                : "bg-ns-surface border-ns-border text-ns-ink hover:bg-ns-surface-hover"
            }`}
          >
            {p}
          </button>
        </span>
      ))}

    <button
      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      disabled={currentPage === totalPages}
      className="p-2 rounded-ns border border-ns-border bg-ns-surface hover:bg-ns-surface-hover text-ns-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      <ChevronRight className="w-4 h-4" />
    </button>

    <span className="ml-2 text-xs font-ui text-ns-ink-muted">
      {currentPage} / {totalPages} · {totalItems} stories
    </span>
  </div>
);

export default BookLists;
