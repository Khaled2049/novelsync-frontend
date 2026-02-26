import "./style.css";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader, BookPlus, Upload, PenLine, Save } from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { storiesRepo } from "../services/StoriesRepo";
import { Chapter } from "@/types/IStory";

// Import components
import { SidebarPanel } from "@/components/SidebarPanel";
import { TipTapEditor } from "@/components/TipTapEditor";
import { WritingStats } from "@/components/WritingStats";
import { Chatbot } from "@/components/chat/Chatbot";
import { ConfirmDialog, UnsavedChangesDialog } from "@/components/ConfirmDialog";
import EditorHeader from "@/components/EditorHeader";
import { Editor } from "@tiptap/react";

// Import hooks
import { useEditorState } from "@/hooks/useEditorState";
import { useAutosave } from "@/hooks/useAutosave";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { FloatingChatButton } from "./chat/FloatingChatButton";

export function SimpleEditor() {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const { user } = useAuthContext();

  // Use the new consolidated state hook
  const { state, actions } = useEditorState();

  // Network status
  const { isOnline } = useNetworkStatus();

  // Editor instance for header
  const [editor, setEditor] = useState<Editor | null>(null);

  // Page count for pagination
  const [pageCount, setPageCount] = useState(1);

  // Zoom level (percentage, e.g., 100 = 100%)
  const [zoomLevel, setZoomLevel] = useState(100);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  const [pendingChapter, setPendingChapter] = useState<Chapter | null>(null);

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
          content
        );

        // Update chapter in list with new content and word count
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
        actions.updateChapterInList(state.currentChapter.id, {
          title: state.chapterTitle,
          content,
          wordCount,
        });
      }

      // Only update story metadata if it changed (optimization)
      if (state.metadataChanged) {
        await storiesRepo.updateStory(
          state.story.id,
          state.storyTitle,
          state.storyDescription
        );
        actions.clearMetadataChanged();
      }
    },
    [state.story, state.currentChapter, state.chapterTitle, state.storyTitle, state.storyDescription, state.metadataChanged, actions]
  );

  // Initialize autosave hook
  const { triggerSave, forceSave, saveState, isDirty, resetSaveState } = useAutosave({
    onSave: performSave,
    debounceMs: 3000,
    enabled: !!state.story && !!state.currentChapter,
  });

  // Load story and chapters
  const loadStory = useCallback(async (loadStoryId: string) => {
    actions.setLoading(true);
    resetSaveState();

    const story = await storiesRepo.getStory(loadStoryId);
    if (story) {
      const storyChapters = await storiesRepo.getChapters(loadStoryId);
      const firstChapter = storyChapters.length > 0 ? storyChapters[0] : null;
      actions.loadStory(story, storyChapters, firstChapter);
    }
  }, [actions, resetSaveState]);

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
      "New Chapter"
    );
    const newChapter = await storiesRepo.getChapter(
      state.story.id,
      newChapterId
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

  return (
    <div className="relative w-full h-full bg-ns-bg flex overflow-hidden">

      {state.isLoading ? (
        /* ── Loading State ── */
        <div className="flex flex-col items-center justify-center w-full h-full gap-4 animate-ns-fade-in">
          <Loader className="w-8 h-8 text-ns-accent animate-spin" />
          <p className="font-heading italic text-lg text-ns-ink-muted">Opening your story…</p>
        </div>
      ) : (
        <>
          {/* ── Left Sidebar ── */}
          <div
            className={`relative bg-ns-surface border-r border-ns-border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex-shrink-0 ${
              state.leftSidebarOpen ? "w-80" : "w-0"
            }`}
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
            aria-label={state.leftSidebarOpen ? "Collapse chapters panel" : "Expand chapters panel"}
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

            {/* Formatting Toolbar */}
            {state.currentChapter && editor && (
              <div className="flex-shrink-0 border-b border-ns-border bg-ns-surface">
                <EditorHeader
                  editor={editor}
                  zoomLevel={zoomLevel}
                  onZoomChange={setZoomLevel}
                  storyId={state.story?.id}
                />
              </div>
            )}

            {/* Writing Canvas */}
            {state.currentChapter ? (
              <div className="flex-1 overflow-y-auto bg-ns-bg">
                <div className="mx-auto px-4 sm:px-8">
                  <TipTapEditor
                    initialContent={state.currentChapter.content}
                    onContentChange={handleContentChange}
                    onSave={handleEditorSave}
                    saveState={saveState}
                    isOnline={isOnline}
                    storyId={state.story?.id || ""}
                    chapterId={state.currentChapter?.id || ""}
                    onEditorReady={setEditor}
                    onPageCountChange={setPageCount}
                    zoomLevel={zoomLevel}
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
            aria-label={state.rightSidebarOpen ? "Collapse stats panel" : "Expand stats panel"}
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
            className={`relative bg-ns-surface border-l border-ns-border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex-shrink-0 ${
              state.rightSidebarOpen ? "w-80" : "w-0"
            }`}
          >
            <div className="w-80 h-full flex flex-col overflow-hidden">
              {/* Tab Bar */}
              <div className="flex border-b border-ns-border flex-shrink-0">
                <button
                  onClick={() => actions.setRightTab("stats")}
                  className={`flex-1 py-2.5 font-ui text-xs font-medium tracking-wide transition-all duration-150 ${
                    state.rightTab === "stats"
                      ? "border-b-2 border-ns-accent text-ns-accent"
                      : "text-ns-ink-muted hover:text-ns-ink-secondary hover:bg-ns-surface-hover"
                  }`}
                >
                  Stats
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {state.rightTab === "stats" && (
                  <div className="p-5 overflow-y-auto h-full">
                    <WritingStats
                      currentChapter={state.currentChapter}
                      chaptersCount={state.chapters.length}
                      pageCount={pageCount}
                    />
                  </div>
                )}
                {state.rightTab === "chat" && state.story?.id && (
                  <Chatbot storyId={state.story.id} mode="sidebar" />
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
