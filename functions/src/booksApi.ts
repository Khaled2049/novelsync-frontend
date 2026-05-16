/**
 * Books API proxy endpoint.
 * This endpoint proxies requests to Google Books API to protect the API key.
 * The API key is stored server-side and never exposed to the client.
 */
import { onRequest } from "firebase-functions/v2/https";
import { corsOptions } from "./corsConfig";
import { requireAuth } from "./authService";

const BOOKS_API_KEY = process.env.BOOKS_API_KEY;
const BOOKS_API_BASE_URL = "https://www.googleapis.com/books/v1";

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Search books endpoint.
 * GET /booksApi/search?q={query}&maxResults={maxResults}
 */
export const searchBooks = onRequest(corsOptions, requireAuth(async (req, res, _userId, _idToken) => {
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

    const url = new URL(`${BOOKS_API_BASE_URL}/volumes`);
    url.searchParams.set("q", query);
    url.searchParams.set("key", BOOKS_API_KEY);
    url.searchParams.set("maxResults", String(maxResults));

    const response = await fetchWithTimeout(url.toString(), 10000);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      const message = errorData?.error?.message || response.statusText;
      res.status(response.status).json({ error: message });
      return;
    }

    res.status(200).json(await response.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
  }
}));

/**
 * Get book details endpoint.
 * GET /getBookDetails?volumeId={volumeId}
 * Alternative: GET /getBookDetails/{volumeId} (extracted from path)
 */
export const getBookDetails = onRequest(corsOptions, requireAuth(async (req, res, _userId, _idToken) => {
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

    const url = new URL(`${BOOKS_API_BASE_URL}/volumes/${volumeId}`);
    url.searchParams.set("key", BOOKS_API_KEY);

    const response = await fetchWithTimeout(url.toString(), 10000);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      const message = errorData?.error?.message || response.statusText;
      res.status(response.status).json({ error: message });
      return;
    }

    res.status(200).json(await response.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
  }
}));
