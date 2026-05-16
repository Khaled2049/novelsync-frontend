/**
 * CORS configuration for Firebase Functions.
 *
 * Production only allows trusted web origins.
 * Localhost origins are allowed only in the emulator.
 */

const productionOrigins = [
  "https://story-6f89f.web.app",
  "https://thetaletribe.com",
  "https://www.thetaletribe.com",
];

const developmentOrigins = ["http://localhost:5173", "http://localhost:3000"];

function getAllowedOrigins(): string[] {
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
  const extraOriginsRaw = process.env.CORS_EXTRA_ORIGINS ?? "";
  const extraOrigins = extraOriginsRaw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return isEmulator
    ? [...productionOrigins, ...developmentOrigins, ...extraOrigins]
    : [...productionOrigins, ...extraOrigins];
}

export const corsOptions = {
  cors: getAllowedOrigins(),
  invoker: "public",
};
