/**
 * Books API proxy endpoint.
 * This endpoint proxies requests to Google Books API to protect the API key.
 * The API key is stored server-side and never exposed to the client.
 */
import { onRequest } from "firebase-functions/v2/https";
import { corsOptions } from "./corsConfig";
import axios from "axios";

const BOOKS_API_KEY = process.env.BOOKS_API_KEY;
const BOOKS_API_BASE_URL = "https://www.googleapis.com/books/v1";

/**
 * Search books endpoint.
 * GET /booksApi/search?q={query}&maxResults={maxResults}
 */
export const searchBooks = onRequest(corsOptions, async (req, res) => {
  // Only allow GET requests
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Check if API key is configured
  if (!BOOKS_API_KEY) {
    res.status(500).json({
      error:
        "Books API key not configured. Please set BOOKS_API_KEY environment variable.",
    });
    return;
  }

  try {
    const query = req.query.q as string;
    const maxResults = req.query.maxResults || "10";

    if (!query) {
      res.status(400).json({ error: "Query parameter 'q' is required" });
      return;
    }

    // Proxy request to Google Books API
    const response = await axios.get(`${BOOKS_API_BASE_URL}/volumes`, {
      params: {
        q: query,
        key: BOOKS_API_KEY,
        maxResults: maxResults,
      },
      timeout: 10000, // 10 second timeout
    });

    res.status(200).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      res.status(status).json({ error: message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

/**
 * Get book details endpoint.
 * GET /getBookDetails?volumeId={volumeId}
 * Alternative: GET /getBookDetails/{volumeId} (extracted from path)
 */
export const getBookDetails = onRequest(corsOptions, async (req, res) => {
  // Only allow GET requests
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Check if API key is configured
  if (!BOOKS_API_KEY) {
    res.status(500).json({
      error:
        "Books API key not configured. Please set BOOKS_API_KEY environment variable.",
    });
    return;
  }

  try {
    // Try to get volumeId from query parameter first, then from path
    let volumeId = req.query.volumeId as string;

    if (!volumeId) {
      // Extract from path: /getBookDetails/{volumeId}
      const pathParts = req.path.split("/").filter(Boolean);
      const functionNameIndex = pathParts.findIndex(
        (part) => part === "getBookDetails"
      );
      if (functionNameIndex !== -1 && pathParts[functionNameIndex + 1]) {
        volumeId = pathParts[functionNameIndex + 1];
      }
    }

    if (!volumeId) {
      res.status(400).json({
        error:
          "Volume ID is required. Use ?volumeId={id} or /getBookDetails/{id}",
      });
      return;
    }

    // Proxy request to Google Books API
    const response = await axios.get(
      `${BOOKS_API_BASE_URL}/volumes/${volumeId}`,
      {
        params: {
          key: BOOKS_API_KEY,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      res.status(status).json({ error: message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});
