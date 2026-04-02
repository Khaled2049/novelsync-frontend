import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";
import { SEOHead } from "@/components/SEO/SEOHead";
import { getAbsoluteUrl, APP_NAME } from "@/config/seo";

interface BookDetailsProps {}

interface Book {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    publisher?: string;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    imageLinks?: {
      thumbnail: string;
    };
  };
}

const BookDetails: React.FC<BookDetailsProps> = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        const response = await api.get("/getBookDetails", {
          params: {
            volumeId: id,
          },
        });
        setBook(response.data);
      } catch (error) {
        console.error("Error fetching book details:", error);
      }
    };

    if (id) {
      fetchBookDetails();
    }
  }, [id]);

  const parseHtmlContent = (htmlContent: string) => {
    const elements: React.ReactNode[] = [];
    const tagRegex = /(<\/?[^>]+>)/g;
    const parts = htmlContent.split(tagRegex);

    parts.forEach((part, index) => {
      if (part.startsWith("<b>")) {
        elements.push(<b key={index}>{part.replace(/<\/?b>/g, "")}</b>);
      } else if (part.startsWith("</b>")) {
        // Skip closing tags since they are handled when opening tag is found
      } else if (part.startsWith("<i>")) {
        elements.push(<i key={index}>{part.replace(/<\/?i>/g, "")}</i>);
      } else if (part.startsWith("</i>")) {
        // Skip closing tags since they are handled when opening tag is found
      } else if (part === "<br>" || part === "<br/>") {
        elements.push(<br key={index} />);
      } else {
        elements.push(part);
      }
    });

    return elements;
  };

  if (!book) {
    return <div>Loading...</div>;
  }

  // Generate structured data for Book schema
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.volumeInfo.title,
    description: book.volumeInfo.description,
    author: book.volumeInfo.authors
      ? book.volumeInfo.authors.map((author) => ({
          "@type": "Person",
          name: author,
        }))
      : undefined,
    image: book.volumeInfo.imageLinks?.thumbnail,
    datePublished: book.volumeInfo.publishedDate,
    publisher: book.volumeInfo.publisher
      ? {
          "@type": "Organization",
          name: book.volumeInfo.publisher,
        }
      : undefined,
    numberOfPages: book.volumeInfo.pageCount,
    aggregateRating: book.volumeInfo.averageRating
      ? {
          "@type": "AggregateRating",
          ratingValue: book.volumeInfo.averageRating,
          ratingCount: book.volumeInfo.ratingsCount || 0,
        }
      : undefined,
    keywords: book.volumeInfo.categories?.join(", "),
    url: getAbsoluteUrl(`/library/book/${book.id}`),
  };

  return (
    <>
      <SEOHead
        title={`${book.volumeInfo.title} - ${APP_NAME} Library`}
        description={
          book.volumeInfo.description ||
          `Read ${book.volumeInfo.title} by ${book.volumeInfo.authors?.join(
            ", "
          )} on ${APP_NAME} Library.`
        }
        keywords={book.volumeInfo.categories || []}
        image={book.volumeInfo.imageLinks?.thumbnail}
        url={`/library/book/${book.id}`}
        type="book"
        author={book.volumeInfo.authors?.join(", ")}
        publishedTime={book.volumeInfo.publishedDate}
        canonical={`/library/book/${book.id}`}
        structuredData={structuredData}
      />
      <div className="flex flex-col items-center min-h-screen  p-4">
        <div className="w-full max-w-lg border  rounded-lg shadow-md  p-4">
          <h1 className="text-2xl font-bold  mb-4">{book.volumeInfo.title}</h1>
          {book.volumeInfo.imageLinks?.thumbnail && (
            <div className="mb-4">
              <img
                src={book.volumeInfo.imageLinks.thumbnail}
                alt={book.volumeInfo.title}
                className="rounded-lg shadow-md"
              />
            </div>
          )}
          <p className="text-lg  mb-2">{book.volumeInfo.authors?.join(", ")}</p>
          <p className="text-sm mb-4">
            Published by {book.volumeInfo.publisher} on{" "}
            {book.volumeInfo.publishedDate}
          </p>
          <p className="text-sm  mb-4">
            {book.volumeInfo.categories?.join(", ")}
          </p>
          <div className="text-sm">
            {parseHtmlContent(
              book.volumeInfo.description || "No description available."
            )}
          </div>
          {book.volumeInfo.averageRating && (
            <div className="mb-4">
              <p className="text-sm ">
                Average Rating: {book.volumeInfo.averageRating} / 5
              </p>
              <p className="text-sm">
                ({book.volumeInfo.ratingsCount} ratings)
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BookDetails;
