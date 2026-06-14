/**
 * Shared option lists for story metadata (category, tags, target audience,
 * language, copyright). Used by the create modal (StoryMetadataModal) and the
 * edit modal (StoryEditModal) so both stay in sync and values stay normalized
 * — every field is picked from a fixed list rather than free-typed.
 */

export interface SelectOption {
  value: string;
  label: string;
}

export const STORY_CATEGORIES: SelectOption[] = [
  { value: "fiction", label: "Fiction" },
  { value: "non-fiction", label: "Non-Fiction" },
  { value: "poetry", label: "Poetry" },
  { value: "fantasy", label: "Fantasy" },
  { value: "science-fiction", label: "Science Fiction" },
  { value: "romance", label: "Romance" },
  { value: "mystery-thriller", label: "Mystery/Thriller" },
  { value: "horror", label: "Horror" },
  { value: "historical-fiction", label: "Historical Fiction" },
  { value: "young-adult", label: "Young Adult" },
  { value: "drama", label: "Drama" },
  { value: "adventure", label: "Adventure" },
];

export const COPYRIGHT_OPTIONS: SelectOption[] = [
  { value: "CC0", label: "Creative Commons Zero" },
];

/**
 * Curated tag list. Tags are normalized: authors pick from these rather than
 * typing arbitrary strings, so the same theme always reads the same way.
 */
export const STORY_TAGS: SelectOption[] = [
  { value: "action", label: "Action" },
  { value: "adventure", label: "Adventure" },
  { value: "coming-of-age", label: "Coming of Age" },
  { value: "dark", label: "Dark" },
  { value: "dystopian", label: "Dystopian" },
  { value: "epic", label: "Epic" },
  { value: "fantasy", label: "Fantasy" },
  { value: "friendship", label: "Friendship" },
  { value: "heist", label: "Heist" },
  { value: "historical", label: "Historical" },
  { value: "horror", label: "Horror" },
  { value: "humor", label: "Humor" },
  { value: "lgbtq", label: "LGBTQ+" },
  { value: "magic", label: "Magic" },
  { value: "military", label: "Military" },
  { value: "mystery", label: "Mystery" },
  { value: "mythology", label: "Mythology" },
  { value: "paranormal", label: "Paranormal" },
  { value: "politics", label: "Politics" },
  { value: "post-apocalyptic", label: "Post-Apocalyptic" },
  { value: "redemption", label: "Redemption" },
  { value: "revenge", label: "Revenge" },
  { value: "romance", label: "Romance" },
  { value: "sci-fi", label: "Sci-Fi" },
  { value: "slow-burn", label: "Slow Burn" },
  { value: "supernatural", label: "Supernatural" },
  { value: "survival", label: "Survival" },
  { value: "suspense", label: "Suspense" },
  { value: "thriller", label: "Thriller" },
  { value: "time-travel", label: "Time Travel" },
  { value: "tragedy", label: "Tragedy" },
  { value: "war", label: "War" },
  { value: "western", label: "Western" },
];

/** Maximum number of tags an author may attach to a story. */
export const MAX_STORY_TAGS = 10;

export const TARGET_AUDIENCES: SelectOption[] = [
  { value: "children", label: "Children (5–8)" },
  { value: "middle-grade", label: "Middle Grade (9–12)" },
  { value: "young-adult", label: "Young Adult (13–18)" },
  { value: "new-adult", label: "New Adult (18–25)" },
  { value: "adult", label: "Adult" },
  { value: "all-ages", label: "All Ages" },
];

export const LANGUAGES: SelectOption[] = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Italian", label: "Italian" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Dutch", label: "Dutch" },
  { value: "Russian", label: "Russian" },
  { value: "Chinese", label: "Chinese" },
  { value: "Japanese", label: "Japanese" },
  { value: "Korean", label: "Korean" },
  { value: "Arabic", label: "Arabic" },
  { value: "Hindi", label: "Hindi" },
];
