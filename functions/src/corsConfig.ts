/**
 * CORS configuration for Firebase Functions.
 * Allows requests from production domain and local development.
 *
 * Note: Firebase Functions v2 only supports origin configuration.
 * Methods, headers, and credentials are handled automatically.
 *
 * Security: Only exact origin matches are allowed (no wildcards).
 * Firebase Functions validates the Origin header against this list.
 */

// Production origins (always allowed)
const productionOrigins = [
  "https://novel-sync.com",
  "https://www.novel-sync.com",
  "https://novelsync-f82ec.web.app",
];

// Development origins (only in emulator/local development)
const developmentOrigins = ["http://localhost:5173", "http://localhost:3000"];

// Combine origins based on environment
const isDevelopment =
  process.env.FUNCTIONS_EMULATOR === "true" ||
  process.env.NODE_ENV === "development";

const allowedOrigins = isDevelopment
  ? [...productionOrigins, ...developmentOrigins]
  : productionOrigins;

export const corsOptions = {
  cors: allowedOrigins,
  invoker: "public",
};
