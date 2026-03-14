import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, BubbleMenu, Editor } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Underline from "@tiptap/extension-underline";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Image from "@tiptap/extension-image";
import CharacterCount from "@tiptap/extension-character-count";
import Heading from "@tiptap/extension-heading";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { slashCommandSuggestion } from "./SlashCommandExtension";
import { SuggestionMenu } from "./SuggestionMenu";
import {
  generateChapter as generateChapterApi,
  generateNextLines,
  waitForJobCompletion,
} from "@/api/brainstormApi";
import { useAiUsage } from "@/contexts/AiUsageContext";
import { Loader, Maximize2, MessageSquare, Sparkles } from "lucide-react";
import { enhanceText } from "@/api/textEnhancementApi";
import { SaveStatusIndicator } from "@/components/SaveStatusIndicator";
import { SaveState } from "@/hooks/useAutosave";
import { storiesRepo } from "@/services/StoriesRepo";
import {
  FontFamilyExtension,
  FontSizeExtension,
  HighlightColorExtension,
  ParagraphStyleExtension,
  TextAlignExtension,
} from "@/components/editorExtensions";

const limit = 50000;

interface TipTapEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
  onSave: (content: string) => void;
  saveState: SaveState;
  isOnline?: boolean;
  storyId: string;
  chapterId?: string;
  onEditorReady?: (editor: Editor | null) => void;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  initialContent,
  onContentChange,
  onSave,
  saveState,
  isOnline = true,
  storyId,
  chapterId,
  onEditorReady,
}) => {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionMenu, setShowSuggestionMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementError, setEnhancementError] = useState<string>("");
  const { incrementAiUsage, canUseAI } = useAiUsage();
  // Initialize the AI generator

  // Function to call your backend API
  const fetchNextLineSuggestions = useCallback(
    async (editorInstance: Editor) => {
      setIsGenerating(true);
      try {
        const content = editorInstance.getHTML();
        const cursorPosition = editorInstance.state.selection.from;

        const response = await generateNextLines({
          storyId,
          content,
          cursorPosition,
          chapterId,
        });

        await incrementAiUsage();

        let suggestionsArray: string[] = [];

        if (response.data && Array.isArray(response.data.suggestions)) {
          suggestionsArray = response.data.suggestions;
        }
        if (suggestionsArray.length === 0) {
          alert("No suggestions were generated. Please try again.");
          return;
        }

        setSuggestions(suggestionsArray);
        setShowSuggestionMenu(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        alert("Failed to generate suggestions. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [storyId, chapterId, incrementAiUsage],
  );

  const generateChapter = useCallback(
    async (editorInstance: Editor) => {
      if (!chapterId) {
        alert("Please select a chapter first.");
        return;
      }

      if (!canUseAI()) {
        alert("Daily AI usage limit reached. Please try again tomorrow.");
        return;
      }

      setIsGenerating(true);
      try {
        const chapter = await storiesRepo.getChapter(storyId, chapterId);
        if (!chapter) {
          throw new Error("Current chapter not found.");
        }

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

        if (!generatedChapterId) {
          throw new Error("No generated chapter was returned.");
        }

        const generatedChapter = await storiesRepo.getChapter(
          storyId,
          generatedChapterId,
        );
        console.debug("[generateChapter] fetched generated chapter", {
          generatedChapterId,
          title: generatedChapter?.title,
          hasContent: Boolean(generatedChapter?.content?.trim()),
        });

        if (!generatedChapter?.content?.trim()) {
          throw new Error("Generated chapter content was empty.");
        }

        editorInstance
          .chain()
          .focus()
          .setContent(generatedChapter.content)
          .run();
        await incrementAiUsage();
      } catch (error) {
        console.error("Error generating chapter:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to generate chapter.";
        alert(errorMessage);
      } finally {
        setIsGenerating(false);
      }
    },
    [storyId, chapterId, canUseAI, incrementAiUsage],
  );

  // Create Tab key extension for AI generation
  const LiteralTab = Extension.create({
    name: "literalTab",

    addOptions() {
      return {
        cooldown: 5000,
      };
    },
  });

  // Create Slash Command Extension - memoized to prevent recreation
  const SlashCommandsExtension = useMemo(() => {
    return Extension.create({
      name: "slashCommands",

      addProseMirrorPlugins() {
        const editorInstance = this.editor;
        return [
          Suggestion({
            editor: editorInstance,
            ...slashCommandSuggestion(
              async () => {
                await fetchNextLineSuggestions(editorInstance);
              },
              async () => {
                await generateChapter(editorInstance);
              },
            ),
          }),
        ];
      },
    });
  }, [fetchNextLineSuggestions, generateChapter]);

  // Initialize the editor
  const editor = useEditor({
    extensions: [
      Document,
      History,
      Paragraph,
      Text,
      Bold,
      Underline,
      Italic,
      Strike,
      Image,
      TextStyle,
      Color,
      FontFamilyExtension,
      FontSizeExtension,
      HighlightColorExtension,
      TextAlignExtension,
      ParagraphStyleExtension,
      LiteralTab,
      SlashCommandsExtension,
      CharacterCount.configure({
        limit,
      }),
      Heading.configure({
        levels: [1, 2],
        HTMLAttributes: {
          "1": { class: "text-3xl font-bold mb-4" },
          "2": { class: "text-2xl font-semibold mb-3" },
        },
      }),
      Placeholder.configure({
        placeholder:
          "Write something already ya silly goose… or type / for commands",
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal",
        },
      }),
      Blockquote,
      HorizontalRule,
      Link.configure({
        openOnClick: false,
      }),
      ListItem,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      onContentChange(content);
      debouncedSave(content);
    },
  });

  // Update editor content when initialContent changes
  useEffect(() => {
    if (editor && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // Notify parent when editor is ready
  useEffect(() => {
    if (onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Handle text enhancement (expand, dialogue, rewrite)
  const handleTextEnhancement = useCallback(
    async (action: "expand" | "dialogue" | "rewrite") => {
      if (!editor) return;

      // Check AI limit BEFORE API call
      if (!canUseAI()) {
        setEnhancementError(
          "Daily AI usage limit reached. Please try again tomorrow.",
        );
        setTimeout(() => setEnhancementError(""), 3000);
        return;
      }

      // Get selected text
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ");

      if (!selectedText.trim()) {
        setEnhancementError("Please select some text first");
        setTimeout(() => setEnhancementError(""), 3000);
        return;
      }

      setIsEnhancing(true);
      setEnhancementError("");

      try {
        const response = await enhanceText({
          storyId,
          action,
          selectedText,
          chapterId,
        });

        // Increment usage counter
        await incrementAiUsage();

        // Replace selected text with AI result
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContentAt(from, response.data.enhancedText)
          .run();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to enhance text";
        setEnhancementError(errorMessage);
        setTimeout(() => setEnhancementError(""), 3000);
      } finally {
        setIsEnhancing(false);
      }
    },
    [editor, storyId, chapterId, canUseAI, incrementAiUsage],
  );

  // Debounce save function
  const debouncedSave = useCallback(
    (content: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onSave(content);
        debounceTimerRef.current = null;
      }, 3000);
    },
    [onSave],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {/* AI Text Enhancement Bubble Menu */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150 }}
        className="bg-black text-white shadow-lg rounded-md overflow-hidden"
        shouldShow={({ from, to }) => from !== to}
      >
        <div className="flex items-center gap-1 bg-black p-1">
          <button
            onClick={() => handleTextEnhancement("expand")}
            disabled={isEnhancing}
            className="px-3 py-2 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            title="Expand text with more detail"
          >
            {isEnhancing ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
            <span>Expand</span>
          </button>

          <button
            onClick={() => handleTextEnhancement("dialogue")}
            disabled={isEnhancing}
            className="px-3 py-2 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            title="Improve dialogue quality"
          >
            {isEnhancing ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            <span>Dialogue</span>
          </button>

          <button
            onClick={() => handleTextEnhancement("rewrite")}
            disabled={isEnhancing}
            className="px-3 py-2 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            title="Rewrite with different phrasing"
          >
            {isEnhancing ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Rewrite</span>
          </button>
        </div>
      </BubbleMenu>

      <div className="w-full bg-ns-elevated text-ns-ink transition-colors">
        <div className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-10 lg:px-16">
          <EditorContent
            onClick={() => editor.commands.focus()}
            className="w-full focus:outline-none max-w-none"
            editor={editor}
          />
        </div>
        <div className="flex justify-center px-6 pb-6">
          <SaveStatusIndicator
            status={saveState.status}
            lastSaved={saveState.lastSaved}
            errorMessage={saveState.errorMessage}
            isOnline={isOnline}
          />
        </div>
      </div>

      {/* Loading indicator for generation */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-ns-elevated border border-ns-border rounded-lg p-6 shadow-xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ns-accent"></div>
              <span className="text-ns-ink">Generating...</span>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Menu */}
      {showSuggestionMenu && suggestions.length > 0 && (
        <SuggestionMenu
          suggestions={suggestions}
          editor={editor}
          onClose={() => {
            setShowSuggestionMenu(false);
            setSuggestions([]);
          }}
        />
      )}

      {/* Error Toast Notification */}
      {enhancementError && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-md">
          <p className="text-sm">{enhancementError}</p>
        </div>
      )}
    </div>
  );
};
