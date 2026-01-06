import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
  const [selectedBookClub, setSelectedBookClub] = useState<string | undefined>(
    undefined
  );
  const maxCharacters = 280;

  const submitPost = async () => {
    if (!content.trim() || isLoading) return;

    try {
      await onSubmit(content.trim(), selectedBookClub);
      setContent("");
      setSelectedBookClub(undefined);
    } catch (error) {
      // Error is handled by parent component, just prevent default behavior
      console.error("Error in form submission:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    await submitPost();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift), allow Shift+Enter for new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitPost();
    }
  };

  const remainingChars = maxCharacters - content.length;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 shadow-sm"
    >
      <div className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What are you reading?"
          className="min-h-[100px] resize-none"
          maxLength={maxCharacters}
          disabled={isLoading}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <span
              className={`text-sm ${
                remainingChars < 20
                  ? "text-red-500 dark:text-red-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {remainingChars} characters remaining
            </span>
          </div>

          <Button
            type="submit"
            disabled={!content.trim() || isLoading || remainingChars < 0}
            className="flex items-center gap-2 bg-dark-green dark:bg-light-green text-white dark:text-black hover:bg-light-green dark:hover:bg-dark-green"
          >
            <Send size={16} />
            {isLoading ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default PostCreationForm;
