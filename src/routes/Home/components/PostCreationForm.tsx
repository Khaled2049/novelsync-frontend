import React, { useState, useRef, useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { IClub } from "@/types/IClub";
import { useContentModeration } from "@/hooks/useContentModeration";

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
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const errorClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxCharacters = 280;

  // Clear any pending auto-dismiss timer on unmount to avoid state updates on
  // an unmounted component.
  useEffect(() => {
    return () => {
      if (errorClearTimer.current) clearTimeout(errorClearTimer.current);
    };
  }, []);

  const { checkContent, isInitializing, initProgress, initStatusText } =
    useContentModeration();

  const submitPost = async () => {
    if (!content.trim() || isLoading || isChecking || isInitializing) return;
    setModerationError(null);
    setIsChecking(true);
    try {
      const result = await checkContent(content.trim());
      if (result.flagged) {
        setModerationError(
          result.reason ||
            "Your post was flagged for potentially harmful content.",
        );
        if (errorClearTimer.current) clearTimeout(errorClearTimer.current);
        errorClearTimer.current = setTimeout(
          () => setModerationError(null),
          5000,
        );
        return;
      }
      await onSubmit(content.trim());
      setContent("");
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setIsChecking(false);
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
  const isBusy = isChecking || isInitializing || isLoading;

  const buttonLabel = isInitializing
    ? "Loading model…"
    : isChecking
      ? "Checking…"
      : isLoading
        ? "Posting…"
        : "Post";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-ns-surface border border-ns-border rounded-ns-lg px-[22px] py-5 mb-7"
    >
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (moderationError) {
            setModerationError(null);
            if (errorClearTimer.current) clearTimeout(errorClearTimer.current);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder="What are you reading?"
        rows={2}
        maxLength={maxCharacters}
        disabled={isBusy}
        className="
          w-full resize-none bg-transparent border-0 outline-none
          font-body text-ns-ink placeholder:text-ns-ink-muted
          text-[17px] leading-relaxed min-h-[44px]
          disabled:opacity-50
        "
      />

      {moderationError && (
        <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-ns-destructive/10 border border-ns-destructive/30 rounded-ns">
          <ShieldAlert
            size={14}
            className="text-ns-destructive mt-0.5 shrink-0"
          />
          <p className="font-ui text-xs text-ns-destructive leading-snug">
            {moderationError}
          </p>
        </div>
      )}

      {isInitializing && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="font-ui text-xs text-ns-ink-muted truncate pr-2">
              {initStatusText}
            </span>
            <span className="font-ui text-xs text-ns-ink-muted tabular-nums shrink-0">
              {Math.round(initProgress * 100)}%
            </span>
          </div>
          <div className="h-1 w-full bg-ns-border rounded-full overflow-hidden">
            <div
              className="h-full bg-ns-accent transition-all duration-300"
              style={{ width: `${initProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-ns-border">
        <span
          className={`font-ui text-[13px] tabular-nums ${
            isOverLimit
              ? "text-ns-destructive font-semibold"
              : isNearLimit
                ? "text-ns-destructive"
                : "text-ns-ink-muted"
          }`}
        >
          {content.length} / {maxCharacters}
        </span>

        <button
          type="submit"
          disabled={!content.trim() || isBusy || isOverLimit}
          className="
            inline-flex items-center px-5 py-[9px]
            bg-ns-accent text-white rounded-full
            font-ui text-sm
            hover:bg-ns-accent-hover
            transition-colors duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
};

export default PostCreationForm;
