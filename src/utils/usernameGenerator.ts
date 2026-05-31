/**
 * Fun, literary-themed username generator.
 * Produces an "AdjectiveNoun" combo, optionally suffixed with a 2-digit number,
 * always kept within the 20-char limit enforced by the signup form.
 */

const ADJECTIVES = [
  "Wandering",
  "Velvet",
  "Ember",
  "Midnight",
  "Gilded",
  "Hollow",
  "Crimson",
  "Whispering",
  "Restless",
  "Inkstained",
  "Moonlit",
  "Wild",
  "Quiet",
  "Brave",
  "Dusty",
  "Golden",
  "Lonesome",
  "Feral",
  "Secret",
  "Storm",
];

const NOUNS = [
  "Quill",
  "Scribe",
  "Wordsmith",
  "Penman",
  "Bard",
  "Inkwell",
  "Chapter",
  "Fable",
  "Verse",
  "Sonnet",
  "Muse",
  "Drifter",
  "Lantern",
  "Raven",
  "Wanderer",
  "Scribbler",
  "Folio",
  "Parchment",
  "Sage",
  "Author",
];

const MAX_LEN = 20;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns a random username like "EmberScribe" or "WildRaven42".
 * Guaranteed to be at most 20 characters.
 */
export function generateUsername(): string {
  const adjective = pick(ADJECTIVES);
  const noun = pick(NOUNS);
  const base = `${adjective}${noun}`;

  // Add a number suffix ~half the time, when it still fits, to cut collisions.
  if (Math.random() < 0.5) {
    const suffix = String(Math.floor(Math.random() * 90) + 10); // 10-99
    if (base.length + suffix.length <= MAX_LEN) {
      return `${base}${suffix}`;
    }
  }

  return base.slice(0, MAX_LEN);
}
