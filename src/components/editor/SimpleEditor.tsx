import "../style.css";
import { useCallback, useEffect, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BookPlus,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Heading1,
  Heading2,
  IndentDecrease,
  IndentIncrease,
  Link2,
  List,
  ListOrdered,
  Loader,
  PenLine,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Save,
  Undo2,
  Upload,
} from "lucide-react";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { storiesRepo } from "../../services/StoriesRepo";
import { Chapter } from "@/types/IStory";

// Import components
import { SidebarPanel } from "@/components/layout/SidebarPanel";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import {
  ConfirmDialog,
  UnsavedChangesDialog,
} from "@/components/common/ConfirmDialog";
import { Editor } from "@tiptap/react";

// Import hooks
import { useEditorState } from "@/hooks/useEditorState";
import { useAutosave } from "@/hooks/useAutosave";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { FloatingChatButton } from "../chat/FloatingChatButton";

export function SimpleEditor() {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const [searchParams] = useSearchParams();
  const openInteractivePanelOnMount = searchParams.get("wizard") === "true";
  const { user } = useAuthContext();

  // Use the new consolidated state hook
  const { state, actions } = useEditorState();

  // Network status
  const { isOnline } = useNetworkStatus();

  // Editor instance for header
  const [editor, setEditor] = useState<Editor | null>(null);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] =
    useState(false);
  const [pendingChapter, setPendingChapter] = useState<Chapter | null>(null);
  const [fontSize, setFontSize] = useState("16px");
  const [fontColor, setFontColor] = useState("#1f2937");
  const [highlightColor, setHighlightColor] = useState("#fef3c7");
  const [lineHeight, setLineHeight] = useState("1.8");
  const [paragraphSpacing, setParagraphSpacing] = useState("0");

  const fontFamilies = [
    "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
    "Georgia, serif",
    "'Times New Roman', serif",
    "'Courier New', monospace",
  ];
  const fontSizes = ["12px", "14px", "16px", "18px", "20px", "24px", "28px"];
  const lineHeights = ["1.2", "1.4", "1.6", "1.8", "2"];
  const paragraphSpacings = ["0", "0.5rem", "0.75rem", "1rem", "1.25rem"];

  // Save function that will be passed to useAutosave
  const performSave = useCallback(
    async (content: string) => {
      if (!state.story) {
        throw new Error("No story selected");
      }

      // Save chapter
      if (state.currentChapter) {
        await storiesRepo.updateChapter(
          state.story.id,
          state.currentChapter.id,
          state.chapterTitle,
          content,
        );

        // Update chapter in list with new content and word count
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
        actions.updateChapterInList(state.currentChapter.id, {
          title: state.chapterTitle,
          wordCount,
        });
      }

      // Only update story metadata if it changed (optimization)
      if (state.metadataChanged) {
        await storiesRepo.updateStory(
          state.story.id,
          state.storyTitle,
          state.storyDescription,
        );
        actions.clearMetadataChanged();
      }
    },
    [
      state.story,
      state.currentChapter,
      state.chapterTitle,
      state.storyTitle,
      state.storyDescription,
      state.metadataChanged,
      actions,
    ],
  );

  // Initialize autosave hook
  const { triggerSave, forceSave, saveState, isDirty, resetSaveState } =
    useAutosave({
      onSave: performSave,
      debounceMs: 3000,
      enabled: !!state.story && !!state.currentChapter,
    });

  // Load story and chapters
  const loadStory = useCallback(
    async (loadStoryId: string) => {
      actions.setLoading(true);
      resetSaveState();

      const story = await storiesRepo.getStory(loadStoryId);
      if (story) {
        const storyChapters = await storiesRepo.getChapters(loadStoryId);
        const firstChapter = storyChapters.length > 0 ? storyChapters[0] : null;
        actions.loadStory(story, storyChapters, firstChapter);
      }
    },
    [actions, resetSaveState],
  );

  // Load story on component mount
  useEffect(() => {
    if (storyId) {
      loadStory(storyId);
    }
  }, [storyId, user, loadStory]);

  // Handle new chapter creation
  const handleNewChapter = async () => {
    if (!state.story) return;

    // Save current content first if dirty
    if (isDirty && state.currentChapter?.content) {
      await forceSave(state.currentChapter.content);
    }

    const newChapterId = await storiesRepo.addChapter(
      state.story.id,
      "New Chapter",
    );
    const newChapter = await storiesRepo.getChapter(
      state.story.id,
      newChapterId,
    );
    if (newChapter) {
      actions.addChapter(newChapter);
      resetSaveState();
    }
  };

  // Handle publishing
  const handlePublish = async () => {
    if (!state.story) return;

    // Save before publishing if dirty
    if (isDirty && state.currentChapter?.content) {
      await forceSave(state.currentChapter.content);
    }

    await storiesRepo.handlePublish(state.story.id);
    navigate("/stories");
  };

  // Handle chapter selection with unsaved changes check
  const handleChapterSelect = (chapter: Chapter) => {
    if (isDirty) {
      setPendingChapter(chapter);
      setUnsavedChangesDialogOpen(true);
    } else {
      actions.selectChapter(chapter);
      resetSaveState();
    }
  };

  // Handle save and continue for unsaved changes dialog
  const handleSaveAndContinue = async () => {
    if (state.currentChapter?.content) {
      await forceSave(state.currentChapter.content);
    }
    if (pendingChapter) {
      actions.selectChapter(pendingChapter);
      resetSaveState();
    }
    setPendingChapter(null);
  };

  // Handle discard and continue
  const handleDiscardAndContinue = () => {
    if (pendingChapter) {
      actions.selectChapter(pendingChapter);
      resetSaveState();
    }
    setPendingChapter(null);
  };

  // Handle metadata changes - trigger save
  const handleMetadataChange = () => {
    if (state.currentChapter && state.currentChapter.content) {
      triggerSave(state.currentChapter.content);
    }
  };

  // Handle content changes in editor
  const handleContentChange = (content: string) => {
    actions.updateChapterContent(content);
  };

  // Handle save from editor (autosave trigger)
  const handleEditorSave = (content: string) => {
    triggerSave(content);
  };

  // Handle chapter delete request
  const handleChapterDeleteRequest = (chapterId: string) => {
    setChapterToDelete(chapterId);
    setDeleteDialogOpen(true);
  };

  // Confirm chapter deletion
  const confirmChapterDelete = async () => {
    if (!state.story || !chapterToDelete) return;

    try {
      await storiesRepo.deleteChapter(state.story.id, chapterToDelete);
      actions.deleteChapter(chapterToDelete);
      resetSaveState();
    } catch (error) {
      console.error("Error deleting chapter:", error);
    }
    setChapterToDelete(null);
  };

  const applyLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter link URL", previousUrl || "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const activeTextAlign = editor?.isActive({ textAlign: "center" })
    ? "center"
    : editor?.isActive({ textAlign: "right" })
      ? "right"
      : editor?.isActive({ textAlign: "justify" })
        ? "justify"
        : "left";

  return (
    <div className="relative w-full h-full bg-ns-bg flex overflow-hidden">
      {state.isLoading ? (
        /* ── Loading State ── */
        <div className="flex flex-col items-center justify-center w-full h-full gap-4 animate-ns-fade-in">
          <Loader className="w-8 h-8 text-ns-accent animate-spin" />
          <p className="font-heading italic text-lg text-ns-ink-muted">
            Opening your story…
          </p>
        </div>
      ) : (
        <>
          {/* ── Left Sidebar ── */}
          <div
            className={`relative bg-ns-surface border-r border-ns-border transition-all duration-300 overflow-hidden flex-shrink-0 ${
              state.leftSidebarOpen ? "w-80" : "w-0"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className="w-80 h-full">
              <SidebarPanel
                chapters={state.chapters}
                currentChapterId={state.currentChapter?.id || ""}
                chapterTitle={state.chapterTitle}
                storyTitle={state.storyTitle}
                onChapterSelect={handleChapterSelect}
                onChapterDelete={handleChapterDeleteRequest}
                onStoryTitleChange={actions.updateStoryTitle}
                onChapterTitleChange={actions.updateChapterTitle}
                onMetadataChange={handleMetadataChange}
                activeTab={state.activeTab}
                onTabChange={actions.setActiveTab}
              />
            </div>
          </div>

          {/* ── Left Sidebar Toggle ── */}
          <button
            onClick={actions.toggleLeftSidebar}
            aria-label={
              state.leftSidebarOpen
                ? "Collapse chapters panel"
                : "Expand chapters panel"
            }
            className="absolute top-1/2 -translate-y-1/2 z-20 bg-ns-elevated border border-ns-border rounded-r-ns py-4 w-5 flex items-center justify-center shadow-ns-sm hover:bg-ns-surface-hover hover:shadow-ns transition-all duration-200 group"
            style={{ left: state.leftSidebarOpen ? "320px" : "0px" }}
          >
            {state.leftSidebarOpen ? (
              <ChevronLeft className="w-3 h-3 text-ns-ink-muted group-hover:text-ns-ink transition-colors" />
            ) : (
              <ChevronRight className="w-3 h-3 text-ns-ink-muted group-hover:text-ns-ink transition-colors" />
            )}
          </button>

          {/* ── Main Editor Area ── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Writing Canvas */}
            {state.currentChapter ? (
              <div className="flex-1 overflow-y-auto bg-ns-bg">
                <div className="mx-auto px-4 sm:px-8 pt-4 pb-6">
                  <TipTapEditor
                    initialContent={state.currentChapter.content}
                    onContentChange={handleContentChange}
                    onSave={handleEditorSave}
                    saveState={saveState}
                    isOnline={isOnline}
                    storyId={state.story?.id || ""}
                    chapterId={state.currentChapter?.id || ""}
                    userId={user?.uid}
                    onEditorReady={setEditor}
                    openInteractivePanelOnMount={openInteractivePanelOnMount}
                  />
                </div>
              </div>
            ) : (
              /* Empty state — no chapter selected */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 animate-ns-fade-in">
                <div className="w-14 h-14 rounded-full bg-ns-accent-subtle flex items-center justify-center">
                  <PenLine className="w-6 h-6 text-ns-accent opacity-70" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-heading italic text-xl text-ns-ink-secondary">
                    Select a chapter to begin writing
                  </p>
                  <p className="font-ui text-xs text-ns-ink-muted">
                    Or create a new chapter using the button below
                  </p>
                </div>
                {state.story && (
                  <button
                    onClick={handleNewChapter}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-ns bg-ns-accent text-white font-ui text-sm font-medium hover:bg-ns-accent-hover active:scale-[0.97] transition-all duration-150 shadow-ns-sm"
                  >
                    <BookPlus className="w-4 h-4" />
                    New Chapter
                  </button>
                )}
              </div>
            )}

            {/* ── Status Bar ── */}
            {state.currentChapter && (
              <div className="flex-shrink-0 border-t border-ns-border bg-ns-surface">
                {/* 3-column grid: left | center | right — right column has padding to clear ThemeToggle */}
                <div className="grid grid-cols-3 items-center px-4 py-2">
                  {/* Left: New Chapter + Save */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleNewChapter}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ns border border-ns-border font-ui text-xs text-ns-ink-secondary hover:bg-ns-surface-hover hover:text-ns-ink hover:border-ns-border-strong active:scale-[0.97] transition-all duration-150"
                    >
                      <BookPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">New Chapter</span>
                      <span className="sm:hidden">New</span>
                    </button>
                    <button
                      onClick={() => {
                        if (state.currentChapter?.content) {
                          forceSave(state.currentChapter.content);
                        }
                      }}
                      disabled={!isDirty || saveState.status === "saving"}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ns border font-ui text-xs active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed border-ns-border text-ns-ink-secondary hover:bg-ns-surface-hover hover:text-ns-ink hover:border-ns-border-strong"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Save</span>
                    </button>
                  </div>

                  {/* Center: Autosave status */}
                  <div className="flex items-center justify-center gap-1.5 font-ui text-xs text-ns-ink-muted select-none">
                    {saveState.status === "saving" && (
                      <>
                        <Loader className="w-3 h-3 animate-spin text-ns-accent flex-shrink-0" />
                        <span>Saving…</span>
                      </>
                    )}
                    {saveState.status === "saved" && <span>Saved</span>}
                    {saveState.status === "error" && (
                      <span className="text-ns-destructive">Save failed</span>
                    )}
                    {!isOnline && <span className="text-ns-gold">Offline</span>}
                  </div>

                  {/* Right: Publish — pr-16 keeps it clear of the fixed ThemeToggle */}
                  <div className="flex items-center justify-end pr-16">
                    <button
                      onClick={handlePublish}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ns font-ui text-xs font-medium active:scale-[0.97] transition-all duration-150 ${
                        state.story?.isPublished
                          ? "bg-ns-destructive text-white hover:bg-ns-destructive-hover"
                          : "bg-ns-accent text-white hover:bg-ns-accent-hover"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {state.story?.isPublished ? "Unpublish" : "Publish"}
                      </span>
                      <span className="sm:hidden">
                        {state.story?.isPublished ? "Unpub" : "Pub"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Sidebar Toggle ── */}
          <button
            onClick={actions.toggleRightSidebar}
            aria-label={
              state.rightSidebarOpen
                ? "Collapse inspector panel"
                : "Expand inspector panel"
            }
            className="absolute top-1/2 -translate-y-1/2 z-20 bg-ns-elevated border border-ns-border rounded-l-ns py-4 w-5 flex items-center justify-center shadow-ns-sm hover:bg-ns-surface-hover hover:shadow-ns transition-all duration-200 group"
            style={{ right: state.rightSidebarOpen ? "320px" : "0px" }}
          >
            {state.rightSidebarOpen ? (
              <ChevronRight className="w-3 h-3 text-ns-ink-muted group-hover:text-ns-ink transition-colors" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-ns-ink-muted group-hover:text-ns-ink transition-colors" />
            )}
          </button>

          {/* ── Right Sidebar ── */}
          <div
            className={`relative bg-ns-surface border-l border-ns-border transition-all duration-300 overflow-hidden flex-shrink-0 ${
              state.rightSidebarOpen ? "w-80" : "w-0"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div className="w-80 h-full flex flex-col overflow-hidden">
              {/* Tab Bar */}
              <div className="flex border-b border-ns-border flex-shrink-0">
                <button
                  onClick={() => actions.setRightTab("format")}
                  className={`flex-1 py-2.5 font-ui text-xs font-medium tracking-wide transition-all duration-150 ${
                    state.rightTab === "format"
                      ? "border-b-2 border-ns-accent text-ns-accent"
                      : "text-ns-ink-muted hover:text-ns-ink-secondary hover:bg-ns-surface-hover"
                  }`}
                >
                  Format
                </button>
                <button
                  onClick={() => actions.setRightTab("document")}
                  className={`flex-1 py-2.5 font-ui text-xs font-medium tracking-wide transition-all duration-150 ${
                    state.rightTab === "document"
                      ? "border-b-2 border-ns-accent text-ns-accent"
                      : "text-ns-ink-muted hover:text-ns-ink-secondary hover:bg-ns-surface-hover"
                  }`}
                >
                  Document
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {state.rightTab === "format" && editor && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] tracking-[0.09em] uppercase text-ns-ink-muted font-ui mb-2">
                        Text
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={fontSize}
                          onChange={(event) => {
                            const value = event.target.value;
                            setFontSize(value);
                            editor.chain().focus().setFontSize(value).run();
                          }}
                          className="rounded-ns border border-ns-border bg-white px-2 py-1.5 text-xs font-ui"
                        >
                          {fontSizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                        <select
                          defaultValue={fontFamilies[0]}
                          onChange={(event) => {
                            editor
                              .chain()
                              .focus()
                              .setFontFamily(event.target.value)
                              .run();
                          }}
                          className="rounded-ns border border-ns-border bg-white px-2 py-1.5 text-xs font-ui"
                        >
                          {fontFamilies.map((family) => (
                            <option key={family} value={family}>
                              {family.includes("Helvetica Neue")
                                ? "Helvetica Neue"
                                : family.split(",")[0].replace(/'/g, "")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => editor.chain().focus().undo().run()}
                          className="p-2 rounded-ns border border-ns-border hover:bg-white"
                          title="Undo"
                        >
                          <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => editor.chain().focus().redo().run()}
                          className="p-2 rounded-ns border border-ns-border hover:bg-white"
                          title="Redo"
                        >
                          <Redo2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            editor.chain().focus().setHorizontalRule().run()
                          }
                          className="p-2 rounded-ns border border-ns-border hover:bg-white"
                          title="Divider"
                        >
                          <RemoveFormatting className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            editor.chain().focus().clearTextFormatting().run()
                          }
                          className="p-2 rounded-ns border border-ns-border hover:bg-white"
                          title="Clear formatting"
                        >
                          <Eraser className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            editor.chain().focus().toggleBold().run()
                          }
                          className={`px-2 py-1.5 rounded-ns border text-xs font-semibold ${editor.isActive("bold") ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Bold"
                        >
                          B
                        </button>
                        <button
                          onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                          }
                          className={`px-2 py-1.5 rounded-ns border text-xs italic ${editor.isActive("italic") ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Italic"
                        >
                          I
                        </button>
                        <button
                          onClick={() =>
                            editor.chain().focus().toggleUnderline().run()
                          }
                          className={`px-2 py-1.5 rounded-ns border text-xs underline ${editor.isActive("underline") ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Underline"
                        >
                          U
                        </button>
                        <button
                          onClick={() =>
                            editor.chain().focus().toggleStrike().run()
                          }
                          className={`px-2 py-1.5 rounded-ns border text-xs line-through ${editor.isActive("strike") ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Strikethrough"
                        >
                          S
                        </button>
                        <button
                          onClick={applyLink}
                          className={`p-2 rounded-ns border ${editor.isActive("link") ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Link"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] tracking-[0.09em] uppercase text-ns-ink-muted font-ui mb-2">
                        Structure
                      </p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() =>
                            editor.chain().focus().setParagraph().run()
                          }
                          className={`p-2 rounded-ns border ${editor.isActive("paragraph") ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Paragraph"
                        >
                          <Pilcrow className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            editor
                              .chain()
                              .focus()
                              .toggleHeading({ level: 1 })
                              .run()
                          }
                          className={`p-2 rounded-ns border ${editor.isActive("heading", { level: 1 }) ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Heading 1"
                        >
                          <Heading1 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            editor
                              .chain()
                              .focus()
                              .toggleHeading({ level: 2 })
                              .run()
                          }
                          className={`p-2 rounded-ns border ${editor.isActive("heading", { level: 2 }) ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Heading 2"
                        >
                          <Heading2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                          }
                          className={`p-2 rounded-ns border ${editor.isActive("bulletList") ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Bullet list"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            editor.chain().focus().toggleOrderedList().run()
                          }
                          className={`p-2 rounded-ns border ${editor.isActive("orderedList") ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Numbered list"
                        >
                          <ListOrdered className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            editor.chain().focus().toggleBlockquote().run()
                          }
                          className={`p-2 rounded-ns border ${editor.isActive("blockquote") ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Quote"
                        >
                          <Quote className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] tracking-[0.09em] uppercase text-ns-ink-muted font-ui mb-2">
                        Paragraph
                      </p>
                      <div className="flex items-center gap-1 flex-wrap mb-2">
                        <button
                          onClick={() =>
                            editor.chain().focus().setTextAlign("left").run()
                          }
                          className={`p-2 rounded-ns border ${activeTextAlign === "left" ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Align left"
                        >
                          <AlignLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            editor.chain().focus().setTextAlign("center").run()
                          }
                          className={`p-2 rounded-ns border ${activeTextAlign === "center" ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Align center"
                        >
                          <AlignCenter className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            editor.chain().focus().setTextAlign("right").run()
                          }
                          className={`p-2 rounded-ns border ${activeTextAlign === "right" ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Align right"
                        >
                          <AlignRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            editor.chain().focus().setTextAlign("justify").run()
                          }
                          className={`p-2 rounded-ns border ${activeTextAlign === "justify" ? "bg-ns-accent-subtle border-ns-accent" : "border-ns-border hover:bg-white"}`}
                          title="Justify"
                        >
                          <AlignJustify className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            editor.chain().focus().decreaseIndent().run()
                          }
                          className="p-2 rounded-ns border border-ns-border hover:bg-white"
                          title="Outdent"
                        >
                          <IndentDecrease className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            editor.chain().focus().increaseIndent().run()
                          }
                          className="p-2 rounded-ns border border-ns-border hover:bg-white"
                          title="Indent"
                        >
                          <IndentIncrease className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={lineHeight}
                          onChange={(event) => {
                            const value = event.target.value;
                            setLineHeight(value);
                            editor.chain().focus().setLineHeight(value).run();
                          }}
                          className="rounded-ns border border-ns-border bg-white px-2 py-1.5 text-xs font-ui"
                        >
                          {lineHeights.map((value) => (
                            <option key={value} value={value}>
                              Line {value}
                            </option>
                          ))}
                        </select>
                        <select
                          value={paragraphSpacing}
                          onChange={(event) => {
                            const value = event.target.value;
                            setParagraphSpacing(value);
                            editor
                              .chain()
                              .focus()
                              .setParagraphSpacing(value)
                              .run();
                          }}
                          className="rounded-ns border border-ns-border bg-white px-2 py-1.5 text-xs font-ui"
                        >
                          {paragraphSpacings.map((value) => (
                            <option key={value} value={value}>
                              Space {value === "0" ? "none" : value}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] tracking-[0.09em] uppercase text-ns-ink-muted font-ui mb-2">
                        Colors
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="rounded-ns border border-ns-border bg-white px-2 py-1.5 text-xs font-ui flex items-center justify-between gap-2">
                          Text
                          <input
                            type="color"
                            value={fontColor}
                            onChange={(event) => {
                              const value = event.target.value;
                              setFontColor(value);
                              editor.chain().focus().setColor(value).run();
                            }}
                            className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                          />
                        </label>
                        <label className="rounded-ns border border-ns-border bg-white px-2 py-1.5 text-xs font-ui flex items-center justify-between gap-2">
                          Highlight
                          <input
                            type="color"
                            value={highlightColor}
                            onChange={(event) => {
                              const value = event.target.value;
                              setHighlightColor(value);
                              editor
                                .chain()
                                .focus()
                                .setHighlightColor(value)
                                .run();
                            }}
                            className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                          />
                        </label>
                      </div>
                      <button
                        onClick={() =>
                          editor.chain().focus().unsetHighlightColor().run()
                        }
                        className="mt-2 w-full rounded-ns border border-ns-border bg-white px-2 py-1.5 text-xs font-ui hover:bg-ns-surface-hover"
                      >
                        Clear highlight
                      </button>
                    </div>
                  </div>
                )}

                {state.rightTab === "document" && (
                  <div className="space-y-4">
                    <div className="rounded-ns border border-ns-border bg-white p-3 space-y-1.5">
                      <p className="text-[10px] tracking-[0.09em] uppercase text-ns-ink-muted font-ui mb-1">
                        Details
                      </p>
                      <p className="text-xs font-ui text-ns-ink-secondary">
                        Words:{" "}
                        <span className="text-ns-ink">
                          {editor?.storage.characterCount?.words?.() || 0}
                        </span>
                      </p>
                      <p className="text-xs font-ui text-ns-ink-secondary">
                        Characters:{" "}
                        <span className="text-ns-ink">
                          {editor?.storage.characterCount?.characters?.() || 0}
                        </span>
                      </p>
                      <p className="text-xs font-ui text-ns-ink-secondary">
                        Chapters:{" "}
                        <span className="text-ns-ink">
                          {state.chapters.length}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-ns border border-ns-border bg-white p-3">
                      <p className="text-[10px] tracking-[0.09em] uppercase text-ns-ink-muted font-ui mb-2">
                        Defaults
                      </p>
                      <button
                        onClick={() => {
                          if (!editor) return;
                          setFontSize("16px");
                          setLineHeight("1.8");
                          setParagraphSpacing("0");
                          setFontColor("#1f2937");
                          setHighlightColor("#fef3c7");
                          editor
                            .chain()
                            .focus()
                            .setFontFamily(fontFamilies[0])
                            .setFontSize("16px")
                            .setColor("#1f2937")
                            .unsetHighlightColor()
                            .setLineHeight("1.8")
                            .setParagraphSpacing("0")
                            .unsetTextAlign()
                            .run();
                        }}
                        className="w-full rounded-ns border border-ns-border bg-white px-2 py-1.5 text-xs font-ui hover:bg-ns-surface-hover"
                      >
                        Reset document style
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── AI Chat FAB (fixed, floating) ── */}
          <FloatingChatButton storyId={state.story?.id} />

          {/* ── Delete Chapter Dialog ── */}
          <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Delete Chapter"
            description="Are you sure you want to delete this chapter? This action cannot be undone."
            confirmLabel="Delete"
            variant="danger"
            onConfirm={confirmChapterDelete}
          />

          {/* ── Unsaved Changes Dialog ── */}
          <UnsavedChangesDialog
            open={unsavedChangesDialogOpen}
            onOpenChange={setUnsavedChangesDialogOpen}
            onSaveAndContinue={handleSaveAndContinue}
            onDiscardAndContinue={handleDiscardAndContinue}
            isSaving={saveState.status === "saving"}
          />
        </>
      )}
    </div>
  );
}
