import "./style.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader } from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { storiesRepo } from "../services/StoriesRepo";
import { Chapter, Story } from "@/types/IStory";

// Import your new components
import { SidebarPanel } from "@/components/SidebarPanel";
import { StoryMetadata } from "@/components/StoryMetadata";
import { SaveControls } from "@/components/SaveControls";
import { TipTapEditor } from "@/components/TipTapEditor";
import { BrainstormIdeas } from "@/components/BrainstormIdeas";
import { WritingStats } from "@/components/WritingStats";

export function SimpleEditor() {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const { user } = useAuthContext();

  // State variables
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [storyTitle, setStoryTitle] = useState("");
  const [storyDescription, setStoryDescription] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [storyLoading, setStoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chapters" | "ai">("chapters");
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Refs for debouncing
  const storyTitleRef = useRef(storyTitle);
  const storyDescriptionRef = useRef(storyDescription);
  const chapterTitleRef = useRef(chapterTitle);

  // Load story and chapters
  const loadStory = async (storyId: string) => {
    setStoryLoading(true);
    const story = await storiesRepo.getStory(storyId);

    if (story) {
      setCurrentStory(story);
      setStoryTitle(story.title);
      setStoryDescription(story.description);
      const storyChapters = await storiesRepo.getChapters(storyId);
      setChapters(storyChapters);
      if (storyChapters.length > 0) {
        setCurrentChapter(storyChapters[0]);
        setChapterTitle(storyChapters[0].title);
        setStoryLoading(false);
      } else {
        setCurrentChapter(null);
        setChapterTitle("");
        setStoryLoading(false);
      }
    }
  };

  // Save function
  const handleSave = useCallback(
    async (content: string) => {
      if (!currentStory) {
        console.error("No story selected");
        return;
      }
      setSaveStatus("Saving...");
      try {
        const saveChapter = async () => {
          if (currentChapter) {
            // Update existing chapter
            await storiesRepo.updateChapter(
              currentStory.id,
              currentChapter.id,
              chapterTitleRef.current,
              content
            );
          } else if (content.trim() || chapterTitleRef.current.trim()) {
            // Add new chapter if content or title is not empty
            const newChapterId = await storiesRepo.addChapter(
              currentStory.id,
              chapterTitleRef.current
            );
            await storiesRepo.updateChapter(
              currentStory.id,
              newChapterId,
              chapterTitleRef.current,
              content
            );
            const newChapter = await storiesRepo.getChapter(
              currentStory.id,
              newChapterId
            );

            if (newChapter) {
              setCurrentChapter(newChapter);
              setChapters((prevChapters) => [...prevChapters, newChapter]);
            }
          }
        };

        // Save chapter and story
        await saveChapter();
        await storiesRepo.updateStory(
          currentStory.id,
          storyTitleRef.current,
          storyDescriptionRef.current
        );

        setChapters((prevChapters) =>
          prevChapters.map((chapter) =>
            chapter.id === currentChapter?.id
              ? {
                  ...chapter,
                  title: chapterTitleRef.current,
                  content,
                }
              : chapter
          )
        );

        setSaveStatus("Saved");
      } catch (error) {
        console.error("Error saving:", error);
        setSaveStatus(error instanceof Error ? error.message : "Error saving");
      } finally {
        setTimeout(() => setSaveStatus(""), 2000);
      }
    },
    [currentStory, currentChapter]
  );

  // Handle new chapter creation
  const handleNewChapter = async () => {
    if (!currentStory) return;
    const newChapterId = await storiesRepo.addChapter(
      currentStory.id,
      "New Chapter"
    );
    await loadStory(currentStory.id); // This will refresh the chapters list
    const newChapter = await storiesRepo.getChapter(
      currentStory.id,
      newChapterId
    );
    if (newChapter) {
      setCurrentChapter(newChapter);
      setChapterTitle(newChapter.title);
    }
  };

  // Handle publishing
  const handlePublish = async () => {
    if (!currentStory) return;
    await storiesRepo.handlePublish(currentStory.id);
    navigate("/stories");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  // Update refs when state changes
  useEffect(() => {
    storyTitleRef.current = storyTitle;
    storyDescriptionRef.current = storyDescription;
    chapterTitleRef.current = chapterTitle;
  }, [storyTitle, storyDescription, chapterTitle]);

  // Load story on component mount
  useEffect(() => {
    if (storyId) {
      loadStory(storyId);
    }
  }, [storyId, user]);

  // Handle chapter selection
  const handleChapterSelect = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    setChapterTitle(chapter.title);
  };

  // Handle metadata changes
  const handleMetadataChange = () => {
    if (currentChapter && currentChapter.content) {
      handleSave(currentChapter.content);
    }
  };

  // Handle content changes in editor
  const handleContentChange = (content: string) => {
    if (currentChapter) {
      setCurrentChapter((prev) => (prev ? { ...prev, content } : null));
    }
  };

  const handleChapterDelete = async (chapterId: string) => {
    if (!currentStory) return;

    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this chapter?")) {
      return;
    }

    try {
      await storiesRepo.deleteChapter(currentStory.id, chapterId);

      // Remove from state
      setChapters((prevChapters) =>
        prevChapters.filter((ch) => ch.id !== chapterId)
      );

      // If deleting current chapter, switch to another one
      if (currentChapter?.id === chapterId) {
        const remainingChapters = chapters.filter((ch) => ch.id !== chapterId);
        if (remainingChapters.length > 0) {
          setCurrentChapter(remainingChapters[0]);
          setChapterTitle(remainingChapters[0].title);
        } else {
          setCurrentChapter(null);
          setChapterTitle("");
        }
      }
    } catch (error) {
      console.error("Error deleting chapter:", error);
      setSaveStatus(
        error instanceof Error ? error.message : "Error deleting chapter"
      );
    }
  };

  return (
    <div className="relative w-full h-full bg-neutral-50 dark:bg-neutral-950 flex overflow-hidden transition-colors duration-200">
      {storyLoading ? (
        <div className="flex items-center justify-center w-full h-full text-dark-green dark:text-light-green">
          <Loader className="w-12 h-12 animate-spin" />
        </div>
      ) : (
        <>
          {/* Left Sidebar */}
          <div
            className={`relative bg-neutral-50 dark:bg-black border-r border-black/10 dark:border-white/10 transition-all duration-300 ease-in-out ${
              leftSidebarOpen ? "w-80" : "w-0"
            } overflow-hidden`}
          >
            <div className="w-80 h-full">
              <SidebarPanel
                chapters={chapters}
                currentChapterId={currentChapter?.id || ""}
                chapterTitle={chapterTitle}
                onChapterSelect={handleChapterSelect}
                onChapterDelete={handleChapterDelete}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </div>

          {/* Left Sidebar Toggle Button */}
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-neutral-50 dark:bg-black border border-black/10 dark:border-white/10 rounded-r-lg p-2 shadow-lg hover:bg-black/5 dark:hover:bg-neutral-50/5 transition-all duration-200"
            style={{ left: leftSidebarOpen ? "320px" : "0px" }}
          >
            {leftSidebarOpen ? (
              <ChevronLeft className="w-4 h-4 text-black dark:text-white" />
            ) : (
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            )}
          </button>

          {/* Main Editor Area - CENTER */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="max-w-4xl mx-auto w-full px-8 flex-shrink-0 py-4">
                <StoryMetadata
                  storyTitle={storyTitle}
                  chapterTitle={chapterTitle}
                  onStoryTitleChange={setStoryTitle}
                  onChapterTitleChange={setChapterTitle}
                  onMetadataChange={handleMetadataChange}
                />
              </div>

              {/* Scrollable Editor Area - THIS IS THE ONLY SCROLLABLE PART */}
              {currentChapter && (
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-4xl mx-auto w-full px-8">
                    <div className="bg-neutral-50 dark:bg-transparent">
                      <TipTapEditor
                        initialContent={currentChapter.content}
                        onContentChange={handleContentChange}
                        onSave={handleSave}
                        saveStatus={saveStatus}
                        storyId={currentStory?.id || ""}
                        chapterId={currentChapter?.id || ""}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Save Controls Component - STAYS FIXED AT BOTTOM */}
              <div className="max-w-4xl mx-auto w-full px-8 pb-4 pt-4 flex-shrink-0">
                <SaveControls
                  isPublished={currentStory?.isPublished || false}
                  onPublish={handlePublish}
                  onNewChapter={handleNewChapter}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar Toggle Button */}
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-neutral-50 dark:bg-black border border-black/10 dark:border-white/10 rounded-l-lg p-2 shadow-lg hover:bg-black/5 dark:hover:bg-neutral-50/5 transition-all duration-200"
            style={{ right: rightSidebarOpen ? "320px" : "0px" }}
          >
            {rightSidebarOpen ? (
              <ChevronRight className="w-4 h-4 text-black dark:text-white" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-black dark:text-white" />
            )}
          </button>

          {/* Right Sidebar - Writing Stats */}
          <div
            className={`relative bg-neutral-50 dark:bg-black border-l border-black/10 dark:border-white/10 transition-all duration-300 ease-in-out ${
              rightSidebarOpen ? "w-80" : "w-0"
            } overflow-hidden`}
          >
            <div className="w-80 h-full p-6 overflow-y-auto">
              <WritingStats
                currentChapter={currentChapter}
                chaptersCount={chapters.length}
              />

              <BrainstormIdeas storyId={currentStory?.id || null} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
