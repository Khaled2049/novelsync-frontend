import { useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/react";
import { BookOpen, Loader, Sparkles, X } from "lucide-react";
import { generateStoryChoices, StoryChoice } from "@/api/ai";
import { useAiUsage } from "@/contexts/AiUsageContext";

const MAX_TURNS = 12;

interface InteractiveStoryPanelProps {
  storyId: string;
  chapterId?: string;
  editor: Editor;
  mode: "opening" | "continuation";
  turnCount: number;
  onClose: () => void;
  onChoiceInserted: () => void;
}

type Phase = "loading" | "choosing" | "ending-loading" | "error";

export function InteractiveStoryPanel({
  storyId,
  chapterId,
  editor,
  mode,
  turnCount,
  onClose,
  onChoiceInserted,
}: InteractiveStoryPanelProps) {
  const { canUseAI, incrementAiUsage } = useAiUsage();

  const [phase, setPhase] = useState<Phase>("loading");
  const [openingScene, setOpeningScene] = useState<string | null>(null);
  const [choices, setChoices] = useState<StoryChoice[]>([]);
  const [customDirection, setCustomDirection] = useState("");
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Track which turn we've already fetched for so re-renders don't re-fetch
  const fetchedForTurn = useRef(-1);

  useEffect(() => {
    if (fetchedForTurn.current === turnCount) return;
    fetchedForTurn.current = turnCount;

    if (!canUseAI()) {
      setErrorMessage(
        "Daily AI usage limit reached. Please try again tomorrow.",
      );
      setPhase("error");
      return;
    }

    setPhase("loading");
    setChoices([]);
    setOpeningScene(null);
    setErrorMessage("");

    const currentMode = turnCount === 0 ? mode : "continuation";

    generateStoryChoices({
      storyId,
      chapterId,
      mode: currentMode,
      currentContent: editor.getHTML(),
      turnCount,
    })
      .then((data) => {
        incrementAiUsage();
        setOpeningScene(data.openingScene ?? null);
        setChoices(data.choices ?? []);
        setPhase("choosing");
      })
      .catch((err: unknown) => {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Failed to generate story choices.",
        );
        setPhase("error");
      });
  }, [turnCount]); // eslint-disable-line react-hooks/exhaustive-deps

  function insertText(text: string) {
    editor.chain().focus().insertContent(text).run();
  }

  function handleChoiceSelect(choice: StoryChoice) {
    const toInsert =
      turnCount === 0 && openingScene
        ? `${openingScene}\n\n${choice.sceneText}`
        : choice.sceneText;
    insertText(toInsert);

    if (choice.isFinal) {
      onClose();
    } else {
      onChoiceInserted();
    }
  }

  async function handleEndStory() {
    if (!canUseAI()) {
      setErrorMessage(
        "Daily AI usage limit reached. Please try again tomorrow.",
      );
      return;
    }
    setPhase("ending-loading");
    try {
      const data = await generateStoryChoices({
        storyId,
        chapterId,
        mode: "ending",
        currentContent: editor.getHTML(),
        turnCount,
      });
      incrementAiUsage();
      const endingChoices = data.choices ?? [];
      if (endingChoices.length > 0) {
        insertText(endingChoices[0].sceneText);
      }
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to generate ending.",
      );
      setPhase("choosing");
    }
  }

  async function handleCustomSubmit() {
    if (!customDirection.trim()) return;
    if (!canUseAI()) {
      setErrorMessage(
        "Daily AI usage limit reached. Please try again tomorrow.",
      );
      return;
    }
    setIsLoadingCustom(true);
    try {
      const data = await generateStoryChoices({
        storyId,
        chapterId,
        mode: "continuation",
        currentContent: customDirection,
        turnCount,
      });
      incrementAiUsage();
      const results = data.choices ?? [];
      if (results.length > 0) {
        insertText(results[0].sceneText);
        onChoiceInserted();
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to generate scene.",
      );
    } finally {
      setIsLoadingCustom(false);
      setCustomDirection("");
    }
  }

  const isNearingEnd = turnCount >= MAX_TURNS - 2;
  const isEndingLoading = phase === "ending-loading";

  return (
    <div
      className="w-full flex flex-col bg-transparent border-0 rounded-none shadow-none overflow-hidden"
      style={{ maxHeight: "46vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ns-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-ns-accent" />
          <span className="font-heading text-sm text-ns-ink">
            {turnCount === 0 ? "Co-write" : "Continue the Story"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {turnCount > 0 && (
            <span className="font-ui text-xs text-ns-ink-muted">
              Turn {turnCount}
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-ns-ink-muted hover:text-ns-ink hover:bg-ns-surface-hover transition-colors"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {/* Loading skeleton */}
        {(phase === "loading" || phase === "ending-loading") && (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 bg-ns-surface rounded w-3/4" />
            <div className="h-3 bg-ns-surface rounded w-full" />
            <div className="h-3 bg-ns-surface rounded w-5/6" />
            <div className="h-16 bg-ns-surface rounded mt-4" />
            <div className="h-16 bg-ns-surface rounded" />
            <div className="h-16 bg-ns-surface rounded" />
          </div>
        )}

        {/* Error state */}
        {phase === "error" && (
          <p className="font-ui text-sm text-ns-destructive py-4 text-center">
            {errorMessage}
          </p>
        )}

        {/* Choices */}
        {phase === "choosing" && (
          <>
            {/* Opening scene block */}
            {openingScene && (
              <div className="rounded-ns bg-ns-accent-subtle border border-ns-border p-3">
                <p className="font-ui text-xs text-ns-ink-muted uppercase tracking-wider mb-1.5">
                  Opening scene
                </p>
                <p className="font-body text-xs text-ns-ink leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {openingScene}
                </p>
              </div>
            )}

            {/* Nearing-end warning */}
            {isNearingEnd && (
              <p className="font-ui text-xs text-ns-ink-muted px-1">
                Story approaching natural length — consider wrapping up.
              </p>
            )}

            {/* Direction choices */}
            <div className="space-y-1.5">
              <p className="font-ui text-xs text-ns-ink-muted uppercase tracking-wider px-1">
                Where does the story go next?
              </p>
              {choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => handleChoiceSelect(choice)}
                  className="w-full text-left rounded-ns border border-ns-border bg-ns-surface hover:bg-ns-surface-hover hover:border-ns-border-strong transition-colors p-3 group"
                >
                  <p className="font-heading text-xs text-ns-ink mb-0.5">
                    {i + 1}. {choice.label}
                  </p>
                  <p className="font-body text-xs text-ns-ink-secondary line-clamp-2 group-hover:line-clamp-none transition-all">
                    {choice.sceneText}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom direction */}
            <div className="border-t border-ns-border pt-3 space-y-2">
              <p className="font-ui text-xs text-ns-ink-muted uppercase tracking-wider px-1">
                Write your own direction
              </p>
              <textarea
                className="w-full bg-ns-surface border border-ns-border rounded-ns px-3 py-2 text-ns-ink font-ui text-xs placeholder:text-ns-ink-muted resize-none focus:outline-none focus:border-ns-accent transition-colors"
                rows={2}
                placeholder="Describe what happens next…"
                value={customDirection}
                onChange={(e) => setCustomDirection(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    void handleCustomSubmit();
                  }
                }}
              />
              {customDirection.trim() && (
                <button
                  onClick={() => void handleCustomSubmit()}
                  disabled={isLoadingCustom}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 font-ui text-xs bg-ns-accent text-white rounded-ns hover:bg-ns-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingCustom ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {isLoadingCustom ? "Writing…" : "Continue with this"}
                </button>
              )}
              {errorMessage && phase === "choosing" && (
                <p className="font-ui text-xs text-ns-destructive">
                  {errorMessage}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer — End Story button, only after first turn */}
      {turnCount > 0 && (
        <div className="px-4 py-2.5 border-t border-ns-border shrink-0">
          <button
            onClick={() => void handleEndStory()}
            disabled={isEndingLoading}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 font-ui text-xs text-ns-ink-secondary border border-ns-border hover:bg-ns-surface-hover rounded-ns transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEndingLoading ? (
              <Loader className="w-3 h-3 animate-spin" />
            ) : (
              <BookOpen className="w-3 h-3" />
            )}
            {isEndingLoading ? "Writing ending…" : "End Story"}
          </button>
        </div>
      )}
    </div>
  );
}
