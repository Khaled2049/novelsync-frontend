import "./style.css";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader, BookPlus, Upload } from "lucide-react";

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
    <div className="relative w-full h-full bg-neutral-50 dark:bg-neutral-950 flex overflow-hidden transition-colors duration-200">
      {state.isLoading ? (
        <div className="flex items-center justify-center w-full h-full text-dark-green dark:text-light-green">
          <Loader className="w-12 h-12 animate-spin" />
        </div>
      ) : (
        <>
          {/* Left Sidebar */}
          <div
            className={`relative bg-neutral-50 dark:bg-black border-r border-black/10 dark:border-white/10 transition-all duration-300 ease-in-out ${
              state.leftSidebarOpen ? "w-80" : "w-0"
            } overflow-hidden`}
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

          {/* Left Sidebar Toggle Button */}
          <button
            onClick={actions.toggleLeftSidebar}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-neutral-50 dark:bg-black border border-black/10 dark:border-white/10 rounded-r-lg p-2 shadow-lg hover:bg-black/5 dark:hover:bg-neutral-50/5 transition-all duration-200"
            style={{ left: state.leftSidebarOpen ? "320px" : "0px" }}
          >
            {state.leftSidebarOpen ? (
              <ChevronLeft className="w-4 h-4 text-black dark:text-white" />
            ) : (
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            )}
          </button>

          {/* Main Editor Area - CENTER */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Fixed Editor Header - like Google Docs */}
            {state.currentChapter && editor && (
              <div className="flex-shrink-0 justify-center flex items-center">
                <EditorHeader editor={editor} zoomLevel={zoomLevel} onZoomChange={setZoomLevel} storyId={state.story?.id} />
              </div>
            )}

            {/* Scrollable Editor Area - A4 Page style */}
            {state.currentChapter && (
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto px-8">
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
            )}

            {/* Bottom Action Bar */}
            {state.currentChapter && (
              <div className="flex-shrink-0 border-t border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-black px-4 py-3">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleNewChapter}
                    className="px-3 py-2 bg-dark-green dark:bg-light-green text-white text-sm rounded-md shadow-sm hover:bg-light-green dark:hover:bg-dark-green transition-colors duration-200 flex items-center gap-1"
                  >
                    <BookPlus className="w-4 h-4" />
                    <span>New Chapter</span>
                  </button>
                  <button
                    onClick={handlePublish}
                    className={`px-3 py-2 text-sm rounded-md shadow-sm transition-colors duration-200 flex items-center gap-1 ${
                      state.story?.isPublished
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-dark-green dark:bg-light-green text-white hover:bg-light-green dark:hover:bg-dark-green"
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>{state.story?.isPublished ? "Unpublish" : "Publish"}</span>
                  </button>
                  <FloatingChatButton storyId={state.story?.id} />
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar Toggle Button */}
          <button
            onClick={actions.toggleRightSidebar}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-neutral-50 dark:bg-black border border-black/10 dark:border-white/10 rounded-l-lg p-2 shadow-lg hover:bg-black/5 dark:hover:bg-neutral-50/5 transition-all duration-200"
            style={{ right: state.rightSidebarOpen ? "320px" : "0px" }}
          >
            {state.rightSidebarOpen ? (
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-black dark:text-white" />
            )}
          </button>

          {/* Right Sidebar - Writing Stats, and Chat */}
          <div
            className={`relative bg-neutral-50 dark:bg-black border-l border-black/10 dark:border-white/10 transition-all duration-300 ease-in-out ${
              state.rightSidebarOpen ? "w-80" : "w-0"
            } overflow-hidden`}
          >
            <div className="w-80 h-full flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-black/10 dark:border-white/10">
                <button
                  onClick={() => actions.setRightTab("stats")}
                  className={`flex-1 py-2 text-sm ${
                    state.rightTab === "stats"
                      ? "border-b-2 border-dark-green text-dark-green dark:border-light-green dark:text-light-green"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  Stats
                </button>

              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {state.rightTab === "stats" && (
                  <div className="p-6 overflow-y-auto h-full">
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

          {/* Delete Chapter Confirmation Dialog */}
          <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Delete Chapter"
            description="Are you sure you want to delete this chapter? This action cannot be undone."
            confirmLabel="Delete"
            variant="danger"
            onConfirm={confirmChapterDelete}
          />

          {/* Unsaved Changes Dialog */}
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
