import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Editor } from "@tiptap/react";
import {
  generateChapter as generateChapterApi,
  generateNextLines,
  waitForJobCompletion,
} from "@/api/ai";
import { storiesRepo } from "@/services/StoriesRepo";

interface UseAiSuggestionsParams {
  storyId: string;
  chapterId?: string;
}

export function useAiSuggestions({
  storyId,
  chapterId,
}: UseAiSuggestionsParams) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionMenu, setShowSuggestionMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // 0–100 progress for chapter generation, pushed from the job's Firestore doc.
  const [generationProgress, setGenerationProgress] = useState(0);

  const fetchNextLineSuggestions = useCallback(
    async (editor: Editor) => {
      setIsGenerating(true);
      try {
        const content = editor.getHTML();
        const cursorPosition = editor.state.selection.from;

        const response = await generateNextLines({
          storyId,
          content,
          cursorPosition,
          chapterId,
        });

        const suggestionsArray =
          response.data && Array.isArray(response.data.suggestions)
            ? response.data.suggestions
            : [];

        if (suggestionsArray.length === 0) {
          toast.error("No suggestions were generated. Please try again.");
          return;
        }

        setSuggestions(suggestionsArray);
        setShowSuggestionMenu(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        toast.error(error instanceof Error ? error.message : "Failed to generate suggestions. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [storyId, chapterId],
  );

  const generateChapter = useCallback(
    async (): Promise<{ chapterId: string; content: string } | undefined> => {
      if (!chapterId) {
        toast.error("Please select a chapter first.");
        return;
      }
      setIsGenerating(true);
      setGenerationProgress(0);
      try {
        const chapter = await storiesRepo.getChapter(storyId, chapterId);
        if (!chapter) throw new Error("Current chapter not found.");

        // Generate INTO the selected chapter: pass its float order (so the
        // backend uses the real neighbors on both sides for continuity) and its
        // id (so the chapter is updated in place — no duplicate / collision).
        const order = chapter.order ?? 0;
        const chapterNumber = order + 1;
        console.debug("[generateChapter] starting chapter generation", {
          storyId,
          chapterId,
          chapterNumber,
          order,
          currentChapterTitle: chapter.title,
        });

        const startResponse = await generateChapterApi({
          storyId,
          chapterNumber,
          order,
          chapterId,
        });
        console.debug("[generateChapter] job queued", startResponse);

        const completedJob = await waitForJobCompletion(startResponse.jobId, {
          onProgress: setGenerationProgress,
        });
        console.debug("[generateChapter] job completed", completedJob);

        const generatedChapterId =
          typeof completedJob.result?.chapterId === "string"
            ? completedJob.result.chapterId
            : "";

        if (!generatedChapterId)
          throw new Error("No generated chapter was returned.");

        const generatedChapter = await storiesRepo.getChapter(
          storyId,
          generatedChapterId,
        );
        console.debug("[generateChapter] fetched generated chapter", {
          generatedChapterId,
          title: generatedChapter?.title,
          hasContent: Boolean(generatedChapter?.content?.trim()),
        });

        if (!generatedChapter?.content?.trim())
          throw new Error("Generated chapter content was empty.");

        // Return the result instead of mutating the editor here. The worker
        // already persisted the content to Firestore; the caller refreshes the
        // in-memory cache and editor display (no re-save, no wrong-chapter
        // clobber if the user navigated away during the job).
        return {
          chapterId: generatedChapterId,
          content: generatedChapter.content,
        };
      } catch (error) {
        console.error("Error generating chapter:", error);
        toast.error(error instanceof Error ? error.message : "Failed to generate chapter.");
        return;
      } finally {
        setIsGenerating(false);
      }
    },
    [storyId, chapterId],
  );

  return {
    suggestions,
    setSuggestions,
    showSuggestionMenu,
    setShowSuggestionMenu,
    isGenerating,
    generationProgress,
    fetchNextLineSuggestions,
    generateChapter,
  };
}
