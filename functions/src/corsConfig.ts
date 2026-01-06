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

// Production origins
const productionOrigins = [
  "https://novel-sync.com",
  "https://www.novel-sync.com",
  "https://novelsync-f82ec.web.app",
];

// Development origins (localhost for local development)
const developmentOrigins = ["http://localhost:5173", "http://localhost:3000"];

// Always include both production and development origins
// This is safe because endpoints are protected by authentication
// CORS is only a browser security feature, not server security
const allowedOrigins = [...productionOrigins, ...developmentOrigins];

export const corsOptions = {
  cors: allowedOrigins,
  invoker: "public",
};
