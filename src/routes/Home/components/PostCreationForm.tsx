import React, { useState } from "react";
import { Send } from "lucide-react";
import { IClub } from "@/types/IClub";

interface PostCreationFormProps {
  onSubmit: (content: string, bookClubId?: string) => Promise<void>;
  bookClubs?: IClub[];
  isLoading?: boolean;
}

const PostCreationForm: React.FC<PostCreationFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [content, setContent] = useState("");
  const maxCharacters = 280;

  const submitPost = async () => {
    if (!content.trim() || isLoading) return;
    try {
      await onSubmit(content.trim());
      setContent("");
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await submitPost();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitPost();
    }
  };

  const remainingChars = maxCharacters - content.length;
  const isNearLimit = remainingChars < 20;
  const isOverLimit = remainingChars < 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-ns-elevated border border-ns-border rounded-ns-lg p-4 mb-5"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What are you reading?"
        rows={3}
        maxLength={maxCharacters}
        disabled={isLoading}
        className="
          w-full resize-none bg-transparent border-0 outline-none
          font-body text-ns-ink placeholder:text-ns-ink-muted
          text-[0.9375rem] leading-relaxed
          disabled:opacity-50
        "
      />

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-ns-border">
        <span className={`font-ui text-xs tabular-nums ${isNearLimit ? "text-ns-destructive" : "text-ns-ink-muted"}`}>
          {remainingChars}
        </span>

        <button
          type="submit"
          disabled={!content.trim() || isLoading || isOverLimit}
          className="
            inline-flex items-center gap-1.5 px-4 py-1.5
            bg-ns-accent text-white rounded-full
            font-ui text-xs font-medium tracking-wide
            hover:bg-ns-accent-hover transition-colors duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <Send size={12} />
          {isLoading ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
};

export default PostCreationForm;
