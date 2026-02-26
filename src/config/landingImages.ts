/**
 * Landing page image URLs.
 *
 * These point to Firebase Storage after running the upload script:
 *   node scripts/upload-landing-images.js <your-storage-bucket>
 *
 * Until then, local paths under public/images/landing/ are used as fallback
 * (works if you have the files locally, but they are gitignored).
 */

export const LANDING_IMAGES = {
  heroEditorial:     "/images/landing/hero-editorial.png",
  aiCopilot:         "/images/landing/ai-copilot.png",
  communityWorkshop: "/images/landing/community-workshop.png",
  challengeArena:    "/images/landing/challenge-arena.png",
  contextEditor:     "/images/landing/context-editor.png",
  bookClubs:         "/images/landing/book-clubs.png",
  minaBrainstorm:    "/images/landing/mina-brainstorm.png",
  cryptoTipping:     "/images/landing/crypto-tipping.png",
  bestWorkEmber:     "/images/landing/best-work-ember.png",
  bestWorkOrbit:     "/images/landing/best-work-orbit.png",
  bestWorkNeon:      "/images/landing/best-work-neon.png",
  bestWorkShowcase:  "/images/landing/best-work-showcase.png",
} as const;
