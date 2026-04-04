import { useState } from "react";
import { SearchIcon } from "lucide-react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { IBook } from "../../types/IBook";
import { SEOHead } from "@/components/SEO/SEOHead";
import { APP_NAME } from "@/config/seo";

const Library = () => {
  const [query, setQuery] = useState<string>("");
  const [books, setBooks] = useState<IBook[]>([]);
  const navigate = useNavigate();

  const handleBookClick = (id: string) => {
    navigate(`/library/book/${id}`);
  };

  const searchBooks = async () => {
    try {
      const response = await api.get<{ items?: IBook[] }>("/searchBooks", {
        params: {
          q: query,
        },
      });
      setBooks(response.data.items || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen  p-4">
      <SEOHead
        title={`Library - ${APP_NAME}`}
        description={`Search and discover books in the ${APP_NAME} library. Find your next great read.`}
        keywords={["library", "book search", "discover books", "reading list"]}
        url="/library"
        canonical="/library"
      />
      {/* Search Bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center border  rounded-lg shadow-md ">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow p-2  rounded-l-lg focus:outline-none"
            placeholder="Search for books..."
          />
          <button onClick={searchBooks} className="p-2   rounded-r-lg">
            <SearchIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Book Results */}
      <div className="w-full max-w-2xl">
        {books.length > 0 ? (
          books.map((book) => (
            <div
              onClick={() => handleBookClick(book.id)}
              key={book.id}
              className="p-4 mb-4 border  rounded-lg shadow-md "
            >
              <h2 className="text-lg font-semibold ">
                {book.volumeInfo.title}
              </h2>
              <p className="text-sm ">{book.volumeInfo.authors?.join(", ")}</p>
              <p className="text-sm">
                {book.volumeInfo.description
                  ? `${book.volumeInfo.description.slice(0, 150)}...`
                  : "No description available."}
              </p>
            </div>
          ))
        ) : (
          <p className="">No results found. Try a different search.</p>
        )}
      </div>
    </div>
  );
};

export default Library;
