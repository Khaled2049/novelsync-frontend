import React, { useRef, useEffect, ChangeEvent } from "react";

interface StoryMetadataProps {
  storyTitle: string;

  chapterTitle: string;
  onStoryTitleChange: (title: string) => void;

  onChapterTitleChange: (title: string) => void;
  onMetadataChange: () => void;
}

export const StoryMetadata: React.FC<StoryMetadataProps> = ({
  storyTitle,

  chapterTitle,
  onStoryTitleChange,

  onChapterTitleChange,
  onMetadataChange,
}) => {
  // Debounce timer for saving
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle changes with debounced saving
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setter: (value: string) => void
  ) => {
    const value = e.target.value;
    setter(value);

    // Debounce metadata saves
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onMetadataChange();
      debounceTimerRef.current = null;
    }, 1000);
  };

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="mb-8 space-y-6">
      <div className="relative">
        <input
          type="text"
          value={storyTitle}
          onChange={(e) => handleInputChange(e, onStoryTitleChange)}
          placeholder="Story Title"
          className="w-full text-3xl font-bold pb-3 bg-transparent border-b border-black/10 dark:border-white/10 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-dark-green dark:focus:border-light-green transition-colors duration-200"
          maxLength={80}
        />
        <div className="absolute right-0 -bottom-5 text-xs text-black/50 dark:text-white/50">
          {storyTitle.length}/80
        </div>
      </div>

      {/* <div className="relative">
        <textarea
          value={storyDescription}
          onChange={(e) => handleInputChange(e, onStoryDescriptionChange)}
          placeholder="Story Description"
          className="w-full text-base pb-3 bg-transparent border-b border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-dark-green dark:focus:border-light-green transition-colors duration-200 resize-none"
          rows={3}
          maxLength={200}
        />
        <div className="absolute right-0 -bottom-5 text-xs text-black/50 dark:text-white/50">
          {storyDescription.length}/200
        </div>
      </div> */}

      <div className="relative">
        <input
          type="text"
          value={chapterTitle}
          onChange={(e) => handleInputChange(e, onChapterTitleChange)}
          placeholder="Chapter Title"
          className="w-full text-2xl font-semibold pb-3 bg-transparent border-b border-black/10 dark:border-white/10 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-dark-green dark:focus:border-light-green transition-colors duration-200"
          maxLength={80}
        />
        <div className="absolute right-0 -bottom-5 text-xs text-black/50 dark:text-white/50">
          {chapterTitle.length}/80
        </div>
      </div>
    </div>
  );
};
