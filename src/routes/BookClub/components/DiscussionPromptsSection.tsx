import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Lock,
  Unlock,
  Plus,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";
import { IDiscussionPrompt, IClub, IPromptResponse } from "@/types/IClub";
import { bookClubRepo } from "../bookClubRepo";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RATE_LIMITS } from "@/config/rateLimits";
import { rateLimitService } from "@/services/RateLimitService";

interface DiscussionPromptsSectionProps {
  club: IClub;
  isCreator: boolean;
  userCurrentChapter?: number;
}

const DiscussionPromptsSection: React.FC<DiscussionPromptsSectionProps> = ({
  club,
  isCreator,
  userCurrentChapter = 0,
}) => {
  const { user } = useAuthContext();
  const prompts = club.discussionPrompts || [];
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [newResponse, setNewResponse] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticResponses, setOptimisticResponses] = useState<
    Record<string, IPromptResponse[]>
  >({});

  const [newPrompt, setNewPrompt] = useState({
    chapterNumber: 1,
    question: "",
    description: "",
  });

  useEffect(() => {
    // Auto-unlock prompts when user reaches required chapter
    if (user && userCurrentChapter > 0) {
      prompts.forEach((prompt) => {
        if (
          userCurrentChapter >= prompt.chapterNumber &&
          !prompt.unlockedFor?.includes(user.uid)
        ) {
          // Optimistic update - real-time listener will sync with server
          bookClubRepo
            .unlockPromptForUser(club.id, prompt.id, user.uid)
            .catch((err) => {
              console.error("Error unlocking prompt:", err);
            });
        }
      });
    }
  }, [userCurrentChapter, user, prompts, club.id]);

  const isPromptUnlocked = (prompt: IDiscussionPrompt): boolean => {
    if (!user) return false;
    return prompt.unlockedFor?.includes(user.uid) || false;
  };

  const handleCreatePrompt = async () => {
    setError(null);

    if (!newPrompt.question.trim()) {
      setError("Please enter a question");
      return;
    }

    // Validate question length
    if (newPrompt.question.length > RATE_LIMITS.MAX_PROMPT_QUESTION_LENGTH) {
      setError(
        `Question is too long. Maximum ${RATE_LIMITS.MAX_PROMPT_QUESTION_LENGTH} characters allowed.`
      );
      return;
    }

    // Validate description length
    if (
      newPrompt.description.length > RATE_LIMITS.MAX_PROMPT_DESCRIPTION_LENGTH
    ) {
      setError(
        `Description is too long. Maximum ${RATE_LIMITS.MAX_PROMPT_DESCRIPTION_LENGTH} characters allowed.`
      );
      return;
    }

    // Check rate limits
    if (user) {
      const rateLimitCheck = await rateLimitService.canCreateDiscussionPrompt(
        user.uid
      );
      if (!rateLimitCheck.allowed) {
        setError(rateLimitCheck.message || "Rate limit exceeded");
        return;
      }
    }

    setIsSaving(true);
    try {
      // Optimistic update - real-time listener will sync with server
      await bookClubRepo.createDiscussionPrompt(club.id, {
        chapterNumber: newPrompt.chapterNumber,
        question: newPrompt.question.trim(),
        description: newPrompt.description.trim(),
        createdAt: new Date().toISOString(),
        creatorId: user!.uid,
        responses: [],
        unlockedFor: [],
      });

      // Increment prompt count
      if (user) {
        await rateLimitService.incrementPromptCount(user.uid);
      }

      setIsCreatingPrompt(false);
      setNewPrompt({ chapterNumber: 1, question: "", description: "" });
      setError(null);
    } catch (error: any) {
      console.error("Error creating prompt:", error);
      setError(error.message || "Failed to create prompt");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddResponse = async (promptId: string) => {
    if (!newResponse.trim() || !user) return;

    setError(null);

    // Validate response length
    if (newResponse.length > RATE_LIMITS.MAX_PROMPT_RESPONSE_LENGTH) {
      setError(
        `Response is too long. Maximum ${RATE_LIMITS.MAX_PROMPT_RESPONSE_LENGTH} characters allowed.`
      );
      return;
    }

    // Check rate limits
    const rateLimitCheck = await rateLimitService.canAddPromptResponse(
      user.uid
    );
    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.message || "Rate limit exceeded");
      return;
    }

    const tempResponse: IPromptResponse = {
      id: `temp-${Date.now()}`,
      userId: user.uid,
      username: user.username || "Anonymous",
      content: newResponse,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update - show response immediately
    setOptimisticResponses((prev) => ({
      ...prev,
      [promptId]: [...(prev[promptId] || []), tempResponse],
    }));

    setIsSaving(true);
    try {
      // Real-time listener will sync with server and replace optimistic response
      await bookClubRepo.addPromptResponse(club.id, promptId, {
        userId: user.uid,
        username: user.username,
        content: newResponse.trim(),
        createdAt: new Date().toISOString(),
      });

      // Increment response count
      await rateLimitService.incrementPromptResponseCount(user.uid);

      setNewResponse("");
      setSelectedPrompt(null);
      setError(null);
      // Clear optimistic response once server confirms
      setOptimisticResponses((prev) => {
        const newResponses = { ...prev };
        delete newResponses[promptId];
        return newResponses;
      });
    } catch (error: any) {
      console.error("Error adding response:", error);
      setError(error.message || "Failed to add response");
      // Rollback optimistic update on error
      setOptimisticResponses((prev) => {
        const newResponses = { ...prev };
        if (newResponses[promptId]) {
          newResponses[promptId] = newResponses[promptId].filter(
            (r) => r.id !== tempResponse.id
          );
          if (newResponses[promptId].length === 0) {
            delete newResponses[promptId];
          }
        }
        return newResponses;
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sortedPrompts = [...prompts].sort(
    (a, b) => a.chapterNumber - b.chapterNumber
  );

  return (
    <section className="mb-10">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-dark-green dark:text-light-green rounded-lg">
              <MessageSquare size={28} />
            </div>
            <h2 className="text-3xl font-serif font-bold text-neutral-900 dark:text-white">
              Discussion Prompts
            </h2>
            <span className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
              {prompts.length}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp
              className="text-dark-green dark:text-light-green"
              size={24}
            />
          ) : (
            <ChevronDown
              className="text-dark-green dark:text-light-green"
              size={24}
            />
          )}
        </button>

        {isExpanded && (
          <div className="p-6 pt-0">
            {isCreator && (
              <div className="mb-6">
                <Button
                  onClick={() => setIsCreatingPrompt(true)}
                  className="bg-dark-green dark:bg-light-green text-white hover:opacity-90"
                >
                  <Plus size={18} className="mr-2" />
                  Create Prompt
                </Button>
              </div>
            )}

            {sortedPrompts.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                <p>No discussion prompts yet.</p>
                {isCreator && (
                  <p className="text-sm mt-2">
                    Create prompts to guide discussions as members read!
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedPrompts.map((prompt) => {
                  const unlocked = isPromptUnlocked(prompt);
                  const canRespond = unlocked && user;
                  const serverResponses = prompt.responses || [];
                  const optimisticPromptResponses =
                    optimisticResponses[prompt.id] || [];
                  // Merge server responses with optimistic responses
                  const responses = [
                    ...serverResponses,
                    ...optimisticPromptResponses,
                  ];

                  return (
                    <div
                      key={prompt.id}
                      className={`p-5 rounded-lg border transition-colors ${
                        unlocked
                          ? "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                          : "bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 opacity-75"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {unlocked ? (
                              <Unlock
                                size={16}
                                className="text-dark-green dark:text-light-green"
                              />
                            ) : (
                              <Lock
                                size={16}
                                className="text-neutral-500 dark:text-neutral-400"
                              />
                            )}
                            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded">
                              Chapter {prompt.chapterNumber}
                            </span>
                            {!unlocked && (
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                (Unlocks at Chapter {prompt.chapterNumber})
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                            {prompt.question}
                          </h3>
                          {prompt.description && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {prompt.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {responses.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                            {responses.length} Response
                            {responses.length !== 1 ? "s" : ""}
                          </p>
                          {responses.slice(0, 3).map((response) => (
                            <div
                              key={response.id}
                              className="p-3 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700"
                            >
                              <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                                {response.username || "Anonymous"}
                              </p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {response.content}
                              </p>
                            </div>
                          ))}
                          {responses.length > 3 && (
                            <button
                              onClick={() => setSelectedPrompt(prompt.id)}
                              className="text-sm text-dark-green dark:text-light-green hover:underline"
                            >
                              View all {responses.length} responses
                            </button>
                          )}
                        </div>
                      )}

                      {canRespond && (
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPrompt(prompt.id)}
                            className="w-full"
                          >
                            <MessageSquare size={16} className="mr-2" />
                            {responses.length === 0
                              ? "Be the first to respond"
                              : "Add Response"}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Prompt Dialog */}
      {isCreatingPrompt && (
        <Dialog open={true} onOpenChange={() => setIsCreatingPrompt(false)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-black dark:text-white">
                Create Discussion Prompt
              </DialogTitle>
              <DialogDescription className="text-neutral-600 dark:text-neutral-400">
                Create a prompt that will unlock when members reach a specific
                chapter
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="chapter" className="text-black dark:text-white">
                  Unlock at Chapter
                </Label>
                <Input
                  id="chapter"
                  type="number"
                  min="1"
                  value={newPrompt.chapterNumber}
                  onChange={(e) =>
                    setNewPrompt({
                      ...newPrompt,
                      chapterNumber: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  className="bg-white dark:bg-neutral-900 text-black dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="question"
                  className="text-black dark:text-white"
                >
                  Question *
                </Label>
                <div className="relative">
                  <Input
                    id="question"
                    value={newPrompt.question}
                    onChange={(e) => {
                      setNewPrompt({ ...newPrompt, question: e.target.value });
                      setError(null);
                    }}
                    maxLength={RATE_LIMITS.MAX_PROMPT_QUESTION_LENGTH}
                    className="bg-white dark:bg-neutral-900 text-black dark:text-white"
                    placeholder="What would you like members to discuss?"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400 dark:text-neutral-500">
                    {newPrompt.question.length}/
                    {RATE_LIMITS.MAX_PROMPT_QUESTION_LENGTH}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-black dark:text-white"
                >
                  Description (Optional)
                </Label>
                <div className="relative">
                  <Textarea
                    id="description"
                    value={newPrompt.description}
                    onChange={(e) => {
                      setNewPrompt({
                        ...newPrompt,
                        description: e.target.value,
                      });
                      setError(null);
                    }}
                    maxLength={RATE_LIMITS.MAX_PROMPT_DESCRIPTION_LENGTH}
                    className="bg-white dark:bg-neutral-900 text-black dark:text-white min-h-[100px]"
                    placeholder="Add context or additional details..."
                  />
                  <div className="absolute right-2 bottom-2 text-xs text-neutral-400 dark:text-neutral-500">
                    {newPrompt.description.length}/
                    {RATE_LIMITS.MAX_PROMPT_DESCRIPTION_LENGTH}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreatingPrompt(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePrompt}
                disabled={
                  isSaving ||
                  !newPrompt.question.trim() ||
                  newPrompt.question.length >
                    RATE_LIMITS.MAX_PROMPT_QUESTION_LENGTH ||
                  newPrompt.description.length >
                    RATE_LIMITS.MAX_PROMPT_DESCRIPTION_LENGTH
                }
                className="bg-dark-green dark:bg-light-green text-white hover:opacity-90"
              >
                {isSaving ? "Creating..." : "Create Prompt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Response Dialog */}
      {selectedPrompt && (
        <Dialog open={true} onOpenChange={() => setSelectedPrompt(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-black dark:text-white">
                {prompts.find((p) => p.id === selectedPrompt)?.question}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              {(() => {
                const prompt = prompts.find((p) => p.id === selectedPrompt);
                if (!prompt) return null;
                const serverResponses = prompt.responses || [];
                const optimisticPromptResponses =
                  optimisticResponses[selectedPrompt] || [];
                const allResponses = [
                  ...serverResponses,
                  ...optimisticPromptResponses,
                ];
                return allResponses.map((response) => (
                  <div
                    key={response.id}
                    className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700"
                  >
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                      {response.username || "Anonymous"}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {response.content}
                    </p>
                  </div>
                ));
              })()}
            </div>

            {isPromptUnlocked(
              prompts.find((p) => p.id === selectedPrompt)!
            ) && (
              <div className="space-y-2">
                {error && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded text-sm">
                    {error}
                  </div>
                )}
                <div className="relative">
                  <Textarea
                    value={newResponse}
                    onChange={(e) => {
                      setNewResponse(e.target.value);
                      setError(null);
                    }}
                    maxLength={RATE_LIMITS.MAX_PROMPT_RESPONSE_LENGTH}
                    className="bg-white dark:bg-neutral-900 text-black dark:text-white min-h-[100px]"
                    placeholder="Share your thoughts..."
                  />
                  <div className="absolute right-2 bottom-2 text-xs text-neutral-400 dark:text-neutral-500">
                    {newResponse.length}/
                    {RATE_LIMITS.MAX_PROMPT_RESPONSE_LENGTH}
                  </div>
                </div>
                <Button
                  onClick={() => handleAddResponse(selectedPrompt)}
                  disabled={
                    isSaving ||
                    !newResponse.trim() ||
                    newResponse.length > RATE_LIMITS.MAX_PROMPT_RESPONSE_LENGTH
                  }
                  className="w-full bg-dark-green dark:bg-light-green text-white hover:opacity-90"
                >
                  {isSaving ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Post Response
                    </>
                  )}
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPrompt(null);
                  setNewResponse("");
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
};

export default DiscussionPromptsSection;
