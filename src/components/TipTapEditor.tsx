import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Underline from "@tiptap/extension-underline";
import Italic from "@tiptap/extension-italic";
import Image from "@tiptap/extension-image";
import CharacterCount from "@tiptap/extension-character-count";
import Heading from "@tiptap/extension-heading";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import EditorHeader from "@/components/EditorHeader";
import { slashCommandSuggestion } from "./SlashCommandExtension";
import { SuggestionMenu } from "./SuggestionMenu";
import { generateNextLines } from "@/api/brainstormApi";
import { useAiUsage } from "@/contexts/AiUsageContext";
import { Loader, Maximize2, MessageSquare, Sparkles } from "lucide-react";
import { enhanceText } from "@/api/textEnhancementApi";

const limit = 50000;

interface TipTapEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
  onSave: (content: string) => void;
  saveStatus: string;
  storyId: string;
  chapterId?: string;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  initialContent,
  onContentChange,
  onSave,
  saveStatus,
  storyId,
  chapterId,
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
    async (editorInstance: any) => {
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
    [storyId, chapterId]
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
            ...slashCommandSuggestion(async () => {
              await fetchNextLineSuggestions(editorInstance);
            }),
          }),
        ];
      },
    });
  }, [fetchNextLineSuggestions]);

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
      Image,
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

  // Handle text enhancement (expand, dialogue, rewrite)
  const handleTextEnhancement = useCallback(
    async (action: 'expand' | 'dialogue' | 'rewrite') => {
      if (!editor) return;

      // Check AI limit BEFORE API call
      if (!canUseAI()) {
        setEnhancementError("Daily AI usage limit reached. Please try again tomorrow.");
        setTimeout(() => setEnhancementError(""), 3000);
        return;
      }

      // Get selected text
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, ' ');

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
        const errorMessage = error instanceof Error ? error.message : "Failed to enhance text";
        setEnhancementError(errorMessage);
        setTimeout(() => setEnhancementError(""), 3000);
      } finally {
        setIsEnhancing(false);
      }
    },
    [editor, storyId, chapterId, canUseAI, incrementAiUsage]
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
    [onSave]
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
    <div className="flex h-full flex-col mb-4">
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150 }}
        className="bg-black text-white shadow-lg rounded-md overflow-hidden"
        shouldShow={({ from, to }) => from !== to}
      >
        <div className="flex items-center gap-1 bg-black p-1">
          {/* Expand Button */}
          <button
            onClick={() => handleTextEnhancement('expand')}
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

          {/* Improve Dialogue Button */}
          <button
            onClick={() => handleTextEnhancement('dialogue')}
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

          {/* Rewrite Button */}
          <button
            onClick={() => handleTextEnhancement('rewrite')}
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

      <div className="flex-1 transition-colors duration-200 min-h-[500px]">
        <EditorContent
          onClick={() => editor.commands.focus()}
          className="w-full h-full focus:outline-none selection:bg-light-green/20 dark:selection:bg-dark-green/20 text-black dark:text-white prose prose-lg max-w-none dark:prose-invert"
          editor={editor}
        />
      </div>

      {/* Loading indicator for generation */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dark-green"></div>
              <span className="text-gray-900 dark:text-white">
                Generating suggestions...
              </span>
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

      <div className="flex flex-col items-center my-3 space-y-1">
        <span
          className={`text-green-600 dark:text-green-400 min-h-[1.5rem] transition-opacity duration-300 ${
            saveStatus ? "opacity-100" : "opacity-0"
          }`}
        >
          {saveStatus}
        </span>
      </div>
      <EditorHeader editor={editor} />
    </div>
  );
};
