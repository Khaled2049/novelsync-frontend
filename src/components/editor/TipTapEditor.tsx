import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { useDemoMode } from "@/contexts/DemoModeContext";
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
import { Markdown } from "@tiptap/markdown";
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
import { useAiUsage } from "@/contexts/AiUsageContext";
import {
  ImageIcon,
  Loader,
  Maximize2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { SaveStatusIndicator } from "@/components/editor/SaveStatusIndicator";
import { SaveState } from "@/hooks/useAutosave";
import {
  FontFamilyExtension,
  FontSizeExtension,
  HighlightColorExtension,
  ParagraphStyleExtension,
  TextAlignExtension,
} from "@/components/editor/editorExtensions";
import { useAiSuggestions } from "@/hooks/useAiSuggestions";
import { useTextEnhancement } from "@/hooks/useTextEnhancement";
import {
  useImageGeneration,
  MAX_CHAPTER_IMAGES,
  countEditorImages,
  validateImageFile,
} from "@/hooks/useImageGeneration";
import { MarkdownHeadingInputRule } from "@/components/editor/markdownHeadingInputRule";
import Code from "@tiptap/extension-code";
import { CodeBlockExtension } from "@/components/editor/CodeBlockExtension";
import {
  TaskListExtension,
  TaskItemExtension,
} from "@/components/editor/TaskListExtensions";

const limit = 50000;
const HeadingWithoutInputRules = Heading.extend({
  addInputRules() {
    return [];
  },
});

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
  onOpenCoWrite?: () => void;
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
  onOpenCoWrite,
}) => {
  const { requireAuth } = useDemoMode();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref so plugins always read the current ids without stale closure
  const uploadContextRef = useRef({ userId, storyId, chapterId });
  const editorRef = useRef<Editor | null>(null);
  const onContentChangeRef = useRef(onContentChange);
  const debouncedSaveRef = useRef<(content: string) => void>(() => {});
  // Ref so the paste plugin (created once) can surface errors via React state
  const pasteErrorRef = useRef<((msg: string) => void) | null>(null);

  uploadContextRef.current = { userId, storyId, chapterId };
  onContentChangeRef.current = onContentChange;

  const { incrementAiUsage, canUseAI } = useAiUsage();

  // Timed error banner shared by all AI features and the paste plugin
  const [editorError, setEditorError] = useState("");
  const showError = useCallback((msg: string) => {
    setEditorError(msg);
    setTimeout(() => setEditorError(""), 3000);
  }, []);

  pasteErrorRef.current = showError;

  // ── Feature hooks ──────────────────────────────────────────────────────────

  const {
    suggestions,
    setSuggestions,
    showSuggestionMenu,
    setShowSuggestionMenu,
    isGenerating,
    fetchNextLineSuggestions,
    generateChapter,
  } = useAiSuggestions({ storyId, chapterId, canUseAI, incrementAiUsage });

  const { isEnhancing, handleTextEnhancement } = useTextEnhancement({
    editor: editorRef.current,
    storyId,
    chapterId,
    canUseAI,
    incrementAiUsage,
    onError: showError,
  });

  const {
    imagePromptOpen,
    setImagePromptOpen,
    imagePrompt,
    setImagePrompt,
    isGeneratingImage,
    openImagePrompt,
    handleGenerateImage,
  } = useImageGeneration({
    editorRef,
    uploadContextRef,
    canUseAI,
    incrementAiUsage,
    onError: showError,
  });

  // ── TipTap extensions ──────────────────────────────────────────────────────

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
                    if (!uploadContextRef.current.userId) {
                      pasteErrorRef.current?.(
                        "Sign in to upload images.",
                      );
                      return true;
                    }
                    const file = item.getAsFile();
                    if (!file) continue;

                    const validationError = validateImageFile(file);
                    if (validationError) {
                      pasteErrorRef.current?.(validationError);
                      return true;
                    }

                    if (
                      countEditorImages(editorInstance) >= MAX_CHAPTER_IMAGES
                    ) {
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
                if (requireAuth()) await fetchNextLineSuggestions(editorInstance);
              },
              async () => {
                if (requireAuth()) await generateChapter(editorInstance);
              },
              () => {
                if (requireAuth()) openImagePrompt();
              },
              () => {
                if (requireAuth()) onOpenCoWrite?.();
              },
            ),
          }),
        ];
      },
    });
  }, [
    fetchNextLineSuggestions,
    generateChapter,
    openImagePrompt,
    onOpenCoWrite,
    requireAuth,
  ]);

  // ── Editor instance ────────────────────────────────────────────────────────

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
      CharacterCount.configure({ limit }),
      HeadingWithoutInputRules.configure({
        levels: [1, 2, 3],
        HTMLAttributes: {
          "1": { class: "text-3xl font-bold mb-4" },
          "2": { class: "text-2xl font-semibold mb-3" },
          "3": { class: "text-xl font-semibold mb-2" },
        },
      }),
      MarkdownHeadingInputRule,
      Placeholder.configure({
        placeholder:
          "Write something already ya silly goose… or type / for commands",
      }),
      BulletList.configure({ HTMLAttributes: { class: "list-disc" } }),
      OrderedList.configure({ HTMLAttributes: { class: "list-decimal" } }),
      Blockquote,
      HorizontalRule,
      Link.configure({ openOnClick: false }),
      ListItem,
      Code,
      CodeBlockExtension,
      TaskListExtension,
      TaskItemExtension,
      Markdown,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      onContentChangeRef.current(content);
      debouncedSaveRef.current(content);
    },
  });

  editorRef.current = editor;

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (editor && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  const debouncedSave = useCallback(
    (content: string) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onSave(content);
        debounceTimerRef.current = null;
      }, 3000);
    },
    [onSave],
  );
  debouncedSaveRef.current = debouncedSave;

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  if (!editor) return null;

  // ── Render ─────────────────────────────────────────────────────────────────

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
            onClick={() => { if (requireAuth()) handleTextEnhancement("expand"); }}
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
            onClick={() => { if (requireAuth()) handleTextEnhancement("dialogue"); }}
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
            onClick={() => { if (requireAuth()) handleTextEnhancement("rewrite"); }}
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
        <div className="flex items-center justify-center gap-4 px-6 pb-6">
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

      {/* Error Toast */}
      {editorError && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-md">
          <p className="text-sm">{editorError}</p>
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
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                  void handleGenerateImage();
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
