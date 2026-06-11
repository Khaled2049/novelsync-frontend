/**
 * Shared option lists for story metadata (category, copyright).
 * Used by the create modal (StoryMetadataModal) and the edit modal
 * (StoryEditModal) so both stay in sync.
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
