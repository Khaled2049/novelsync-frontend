import React, { useState, useEffect } from "react";

// Types
interface Book {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    imageLinks?: {
      thumbnail: string;
    };
    description?: string;
    publishedDate?: string;
  };
}

interface Category {
  id: string;
  name: string;
  query: string;
}

const CategoriesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("fiction");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Predefined categories
  const categories: Category[] = [
    { id: "1", name: "Fiction", query: "fiction" },
    { id: "2", name: "Science", query: "science" },
    { id: "3", name: "History", query: "history" },
    { id: "4", name: "Biography", query: "biography" },
    { id: "5", name: "Technology", query: "technology" },
    { id: "6", name: "Business", query: "business" },
    { id: "7", name: "Art", query: "art" },
    { id: "8", name: "Poetry", query: "poetry" },
  ];

  // Fetch books function
  const fetchBooks = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const searchQuery = searchTerm
        ? `${query}+intitle:${searchTerm}`
        : `subject:${query}`;

      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=12`
      );
      const data = await response.json();

      if (data.items) {
        setBooks(data.items);
        setSearchTerm("");
      } else {
        setBooks([]);
      }
    } catch (err) {
      setError("Failed to fetch books. Please try again later.");
      console.error("Error fetching books:", err);
    } finally {
      setLoading(false);
    }
  };

  const searchBooks = async (query: string, isSearchBarQuery: boolean) => {
    setLoading(true);
    setError(null);
    try {
      // If it's a search bar query, don't include category
      const searchQuery = isSearchBarQuery ? query : `subject:${query}`;

      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=12`
      );
      const data = await response.json();

      if (data.items) {
        setBooks(data.items);
      } else {
        setBooks([]);
      }
    } catch (err) {
      setError("Failed to fetch books. Please try again later.");
      console.error("Error fetching books:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchBooks(searchTerm, true);
      setSearchTerm("");
    }
  };

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Effect for category changes
  useEffect(() => {
    fetchBooks(selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Categories Sidebar */}
        <div className="w-full md:w-72 flex-shrink-0">
          <div className="bg-[#f9f8f4] border border-[#ebe8e4] rounded-lg p-6">
            <h2 className="text-2xl font-serif text-[#382110] mb-6 pb-3 border-b border-[#ebe8e4]">
              Browse Categories
            </h2>
            <ul className="space-y-1">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    onClick={() => setSelectedCategory(category.query)}
                    className={`w-full text-left px-4 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2
              ${
                selectedCategory === category.query
                  ? "bg-[#382110] text-[#f9f8f4]"
                  : "text-[#382110] hover:bg-[#ebe8e4]"
              }
            `}
                  >
                    <span className="text-lg font-serif">
                      {selectedCategory === category.query ? "•" : ""}
                    </span>
                    {category.name}
                    <span className="ml-auto text-sm opacity-70">
                      {selectedCategory === category.query ? "→" : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Optional decorative element */}
          <div className="hidden md:block mt-6 px-6">
            <div className="h-px bg-gradient-to-r from-transparent via-[#ebe8e4] to-transparent"></div>
            <div className="mt-6 text-center">
              <span className="font-serif text-[#382110] opacity-60 text-sm italic">
                "Books are a uniquely portable magic."
              </span>
            </div>
          </div>
        </div>

        {/* Books Content */}
        <div className="flex-grow">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative flex gap-2">
              <input
                type="text"
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-grow px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {/* Books Grid */}
          {error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className=" rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-w-3 aspect-h-4">
                    {book.volumeInfo.imageLinks ? (
                      <img
                        src={book.volumeInfo.imageLinks.thumbnail}
                        alt={book.volumeInfo.title}
                        className="object-cover w-full h-48"
                      />
                    ) : (
                      <div className="bg-gray-200 w-full h-48 flex items-center justify-center">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {book.volumeInfo.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {book.volumeInfo.authors?.join(", ") || "Unknown Author"}
                    </p>
                    {book.volumeInfo.description && (
                      <p className="text-gray-500 text-sm line-clamp-3">
                        {book.volumeInfo.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
