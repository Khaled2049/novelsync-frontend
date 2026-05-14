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
    async (editor: Editor) => {
      if (!chapterId) {
        toast.error("Please select a chapter first.");
        return;
      }
      setIsGenerating(true);
      try {
        const chapter = await storiesRepo.getChapter(storyId, chapterId);
        if (!chapter) throw new Error("Current chapter not found.");

        const chapterNumber = (chapter.order ?? 0) + 1;
        console.debug("[generateChapter] starting chapter generation", {
          storyId,
          chapterId,
          chapterNumber,
          currentChapterTitle: chapter.title,
        });

        const startResponse = await generateChapterApi({
          storyId,
          chapterNumber,
        });
        console.debug("[generateChapter] job queued", startResponse);

        const completedJob = await waitForJobCompletion(startResponse.jobId);
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

        editor.chain().focus().setContent(generatedChapter.content).run();
      } catch (error) {
        console.error("Error generating chapter:", error);
        toast.error(error instanceof Error ? error.message : "Failed to generate chapter.");
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
    fetchNextLineSuggestions,
    generateChapter,
  };
}
