import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Underline from "@tiptap/extension-underline";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import { ImageNode } from "@/components/editor/ImageNode";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { storageService } from "@/services/StorageService";
import CharacterCount from "@tiptap/extension-character-count";
import Heading from "@tiptap/extension-heading";
import {
  UndoRedo,
  Gapcursor,
  Dropcursor,
  TrailingNode,
} from "@tiptap/extensions";
import Placeholder from "@tiptap/extension-placeholder";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
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
import {
  ImageIcon,
  Loader,
  Maximize2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { generateCover } from "@/services/imageGenerationService";
import { enhanceText } from "@/api/textEnhancementApi";
import { SaveStatusIndicator } from "@/components/editor/SaveStatusIndicator";
import { SaveState } from "@/hooks/useAutosave";
import { storiesRepo } from "@/services/StoriesRepo";
import {
  FontFamilyExtension,
  FontSizeExtension,
  HighlightColorExtension,
  ParagraphStyleExtension,
  TextAlignExtension,
} from "@/components/editor/editorExtensions";

const limit = 50000;

const MAX_CHAPTER_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function countEditorImages(editor: Editor): number {
  let count = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "image") count++;
  });
  return count;
}

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type))
    return "Unsupported format. Use JPEG, PNG, or WebP.";
  if (file.size > MAX_IMAGE_BYTES)
    return "Image too large. Maximum size is 2 MB.";
  return null;
}

interface TipTapEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
  onSave: (content: string) => void;
  saveState: SaveState;
  isOnline?: boolean;
  storyId: string;
  chapterId?: string;
  userId?: string;
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
  userId,
  onEditorReady,
}) => {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref so the paste plugin always reads the current ids without stale closure
  const uploadContextRef = useRef({ userId, storyId, chapterId });
  // Ref to the editor instance so callbacks defined before useEditor can access it
  const editorRef = useRef<Editor | null>(null);
  // Refs for onUpdate callbacks to avoid stale closures in the editor instance
  const onContentChangeRef = useRef(onContentChange);
  const debouncedSaveRef = useRef<(content: string) => void>(() => {});
  // Ref so the paste plugin (created once) can surface errors via React state
  const pasteErrorRef = useRef<((msg: string) => void) | null>(null);
  uploadContextRef.current = { userId, storyId, chapterId };
  onContentChangeRef.current = onContentChange;

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionMenu, setShowSuggestionMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementError, setEnhancementError] = useState<string>("");
  const [imagePromptOpen, setImagePromptOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { incrementAiUsage, canUseAI } = useAiUsage();
  // Keep pasteErrorRef current so the paste plugin (initialized once) can show toasts
  pasteErrorRef.current = (msg: string) => {
    setEnhancementError(msg);
    setTimeout(() => setEnhancementError(""), 3000);
  };

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

  // Opens the image generation modal (called by the slash command)
  const openImagePrompt = useCallback(() => {
    setImagePrompt("");
    setImagePromptOpen(true);
  }, []);

  // Generates an image from the prompt, uploads to Storage, inserts into editor
  const handleGenerateImage = useCallback(async () => {
    const editorInstance = editorRef.current;
    if (!editorInstance || !imagePrompt.trim()) return;
    if (countEditorImages(editorInstance) >= MAX_CHAPTER_IMAGES) {
      setEnhancementError(`Maximum ${MAX_CHAPTER_IMAGES} images per chapter.`);
      setTimeout(() => setEnhancementError(""), 3000);
      return;
    }
    if (!canUseAI()) {
      setEnhancementError(
        "Daily AI usage limit reached. Please try again tomorrow.",
      );
      setTimeout(() => setEnhancementError(""), 3000);
      return;
    }
    setIsGeneratingImage(true);
    try {
      const { file } = await generateCover(imagePrompt.trim());
      const {
        userId: uid,
        storyId: sid,
        chapterId: cid,
      } = uploadContextRef.current;
      const url = await storageService.uploadChapterImage(
        file,
        uid ?? "",
        sid,
        cid ?? "",
      );
      await incrementAiUsage();
      editorInstance.chain().focus().setImage({ src: url }).run();
      setImagePromptOpen(false);
      setImagePrompt("");
    } catch (err) {
      console.error("Image generation failed:", err);
      setEnhancementError("Image generation failed. Please try again.");
      setTimeout(() => setEnhancementError(""), 3000);
    } finally {
      setIsGeneratingImage(false);
    }
  }, [imagePrompt, canUseAI, incrementAiUsage]);

  // Paste handler: intercepts clipboard images, uploads to Firebase Storage, inserts URL
  const ImagePasteExtension = useMemo(() => {
    return Extension.create({
      name: "imagePaste",
      addProseMirrorPlugins() {
        const editorInstance = this.editor;
        return [
          new Plugin({
            key: new PluginKey("imagePaste"),
            props: {
              handlePaste(_view, event) {
                const items = event.clipboardData?.items;
                if (!items) return false;
                for (const item of Array.from(items)) {
                  if (item.type.startsWith("image/")) {
                    event.preventDefault();
                    const file = item.getAsFile();
                    if (!file) continue;

                    const validationError = validateImageFile(file);
                    if (validationError) {
                      pasteErrorRef.current?.(validationError);
                      return true;
                    }

                    if (countEditorImages(editorInstance) >= MAX_CHAPTER_IMAGES) {
                      pasteErrorRef.current?.(
                        `Maximum ${MAX_CHAPTER_IMAGES} images per chapter.`,
                      );
                      return true;
                    }

                    const {
                      userId: uid,
                      storyId: sid,
                      chapterId: cid,
                    } = uploadContextRef.current;
                    void (async () => {
                      try {
                        const url = await storageService.uploadChapterImage(
                          file,
                          uid ?? "",
                          sid,
                          cid ?? "",
                        );
                        editorInstance
                          .chain()
                          .focus()
                          .setImage({ src: url })
                          .run();
                      } catch (err) {
                        console.error("Image upload failed:", err);
                      }
                    })();
                    return true;
                  }
                }
                return false;
              },
            },
          }),
        ];
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
              () => {
                openImagePrompt();
              },
            ),
          }),
        ];
      },
    });
  }, [fetchNextLineSuggestions, generateChapter, openImagePrompt]);

  // Initialize the editor
  const editor = useEditor({
    extensions: [
      Document,
      UndoRedo,
      Gapcursor,
      Dropcursor,
      TrailingNode,
      Paragraph,
      Text,
      Bold,
      Underline,
      Italic,
      Strike,
      ImageNode,
      ImagePasteExtension,
      TextStyle,
      Color,
      FontFamilyExtension,
      FontSizeExtension,
      HighlightColorExtension,
      TextAlignExtension,
      ParagraphStyleExtension,
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
      onContentChangeRef.current(content);
      debouncedSaveRef.current(content);
    },
  });

  // Keep editorRef in sync so callbacks defined before useEditor can use it
  editorRef.current = editor;

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
  debouncedSaveRef.current = debouncedSave;

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

      {/* Image Generation Modal */}
      {imagePromptOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setImagePromptOpen(false);
          }}
        >
          <div className="bg-ns-elevated border border-ns-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-ns-accent" />
              <h2 className="font-heading text-lg text-ns-ink">
                Generate Image
              </h2>
            </div>
            <p className="font-ui text-sm text-ns-ink-secondary">
              Describe the image you want to create.
            </p>
            <textarea
              autoFocus
              className="w-full bg-ns-surface border border-ns-border rounded-ns px-3 py-2 text-ns-ink font-ui text-sm placeholder:text-ns-ink-muted resize-none focus:outline-none focus:border-ns-accent transition-colors"
              rows={3}
              placeholder="A misty forest at dawn with golden light filtering through ancient oaks…"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  void handleGenerateImage();
                }
                if (e.key === "Escape") setImagePromptOpen(false);
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setImagePromptOpen(false)}
                className="px-4 py-2 font-ui text-sm text-ns-ink-secondary hover:text-ns-ink hover:bg-ns-surface-hover rounded-ns transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleGenerateImage()}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="px-4 py-2 font-ui text-sm bg-ns-accent text-white rounded-ns hover:bg-ns-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGeneratingImage ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isGeneratingImage ? "Generating…" : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
