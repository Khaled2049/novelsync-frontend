import React, { useState } from "react";
import { BarChart3, Plus, CheckCircle2 } from "lucide-react";
import { IPoll, IClub, IBookOfTheMonth } from "@/types/IClub";
import { bookClubRepo } from "../bookClubRepo";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import BookSearch from "@/components/BookSearch";
import { RATE_LIMITS } from "@/config/rateLimits";
import { rateLimitService } from "@/services/RateLimitService";

interface PollsSectionProps {
  club: IClub;
  isCreator: boolean;
}

const PollsSection: React.FC<PollsSectionProps> = ({ club, isCreator }) => {
  const { user } = useAuthContext();
  const polls = club.polls || [];
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticVotes, setOptimisticVotes] = useState<
    Record<string, number>
  >({});

  const [newPoll, setNewPoll] = useState({
    type: "book-selection" as IPoll["type"],
    question: "",
    options: [] as Array<{ text: string; bookData?: IBookOfTheMonth }>,
    endDate: "",
  });

  const [newOptionText, setNewOptionText] = useState("");
  const [selectedBookForOption, setSelectedBookForOption] =
    useState<IBookOfTheMonth | null>(null);

  const handleAddOption = () => {
    // Check option limit
    if (newPoll.options.length >= RATE_LIMITS.MAX_POLL_OPTIONS) {
      setError(
        `Maximum ${RATE_LIMITS.MAX_POLL_OPTIONS} options allowed per poll`
      );
      return;
    }

    if (newPoll.type === "book-selection" && selectedBookForOption) {
      const optionText = selectedBookForOption.volumeInfo.title;
      if (optionText.length > RATE_LIMITS.MAX_POLL_OPTION_LENGTH) {
        setError(
          `Option text is too long. Maximum ${RATE_LIMITS.MAX_POLL_OPTION_LENGTH} characters allowed.`
        );
        return;
      }
      setNewPoll({
        ...newPoll,
        options: [
          ...newPoll.options,
          {
            text: optionText,
            bookData: selectedBookForOption,
          },
        ],
      });
      setSelectedBookForOption(null);
      setError(null);
    } else if (newOptionText.trim()) {
      if (newOptionText.length > RATE_LIMITS.MAX_POLL_OPTION_LENGTH) {
        setError(
          `Option text is too long. Maximum ${RATE_LIMITS.MAX_POLL_OPTION_LENGTH} characters allowed.`
        );
        return;
      }
      setNewPoll({
        ...newPoll,
        options: [...newPoll.options, { text: newOptionText.trim() }],
      });
      setNewOptionText("");
      setError(null);
    }
  };

  const handleRemoveOption = (index: number) => {
    setNewPoll({
      ...newPoll,
      options: newPoll.options.filter((_, i) => i !== index),
    });
  };

  const handleCreatePoll = async () => {
    setError(null);

    // Validate question
    if (!newPoll.question.trim()) {
      setError("Please enter a question");
      return;
    }
    if (newPoll.question.length > RATE_LIMITS.MAX_POLL_QUESTION_LENGTH) {
      setError(
        `Question is too long. Maximum ${RATE_LIMITS.MAX_POLL_QUESTION_LENGTH} characters allowed.`
      );
      return;
    }

    // Validate options
    if (newPoll.options.length < 2) {
      setError("Please add at least 2 options");
      return;
    }
    if (newPoll.options.length > RATE_LIMITS.MAX_POLL_OPTIONS) {
      setError(
        `Maximum ${RATE_LIMITS.MAX_POLL_OPTIONS} options allowed per poll`
      );
      return;
    }

    // Validate each option length
    for (const option of newPoll.options) {
      if (option.text.length > RATE_LIMITS.MAX_POLL_OPTION_LENGTH) {
        setError(
          `Option "${option.text.substring(0, 20)}..." is too long. Maximum ${
            RATE_LIMITS.MAX_POLL_OPTION_LENGTH
          } characters allowed.`
        );
        return;
      }
    }

    // Check rate limits
    if (user) {
      const rateLimitCheck = await rateLimitService.canCreatePoll(user.uid);
      if (!rateLimitCheck.allowed) {
        setError(rateLimitCheck.message || "Rate limit exceeded");
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      // Optimistic update - real-time listener will sync with server
      await bookClubRepo.createPoll(club.id, {
        type: newPoll.type,
        question: newPoll.question.trim(),
        options: newPoll.options,
        votes: {},
        createdAt: new Date().toISOString(),
        creatorId: user!.uid,
        isActive: true,
        endDate: newPoll.endDate || undefined,
      });

      // Increment poll count
      if (user) {
        await rateLimitService.incrementPollCount(user.uid);
      }

      setIsCreatingPoll(false);
      setNewPoll({
        type: "book-selection",
        question: "",
        options: [],
        endDate: "",
      });
      setNewOptionText("");
      setSelectedBookForOption(null);
    } catch (err: any) {
      console.error("Error creating poll:", err);
      setError(err.message || "Failed to create poll");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!user) return;

    // Get current vote before updating (for potential rollback)
    const poll = polls.find((p) => p.id === pollId);
    const currentVote = poll?.votes[user.uid];

    // Check if this is a vote change (not first vote)
    const isVoteChange =
      currentVote !== undefined && currentVote !== optionIndex;

    // Check rate limit for vote changes
    if (isVoteChange) {
      const rateLimitCheck = await rateLimitService.canChangePollVote(user.uid);
      if (!rateLimitCheck.allowed) {
        setError(
          rateLimitCheck.message || "Rate limit exceeded for vote changes"
        );
        return;
      }
    }

    // Optimistic update - update UI immediately
    setOptimisticVotes((prev) => ({
      ...prev,
      [pollId]: optionIndex,
    }));

    try {
      // Real-time listener will sync with server
      await bookClubRepo.voteOnPoll(club.id, pollId, user.uid, optionIndex);

      // Increment vote change count if this was a change
      if (isVoteChange) {
        await rateLimitService.incrementVoteChangeCount(user.uid);
      }
    } catch (error) {
      console.error("Error voting:", error);
      // Rollback optimistic update on error - restore previous vote or remove if no previous vote
      setOptimisticVotes((prev) => {
        const newVotes = { ...prev };
        if (currentVote !== undefined) {
          newVotes[pollId] = currentVote;
        } else {
          delete newVotes[pollId];
        }
        return newVotes;
      });
    }
  };

  const getUserVote = (poll: IPoll): number | null => {
    if (!user) return null;
    // Check optimistic vote first, then actual vote
    if (optimisticVotes[poll.id] !== undefined) {
      return optimisticVotes[poll.id];
    }
    return poll.votes[user.uid] !== undefined ? poll.votes[user.uid] : null;
  };

  const getVoteCounts = (poll: IPoll): number[] => {
    const counts = new Array(poll.options.length).fill(0);
    Object.values(poll.votes).forEach((optionIndex) => {
      if (optionIndex >= 0 && optionIndex < poll.options.length) {
        counts[optionIndex]++;
      }
    });
    // Add optimistic vote if it exists and hasn't been synced yet
    if (user && optimisticVotes[poll.id] !== undefined) {
      const optimisticVote = optimisticVotes[poll.id];
      if (optimisticVote >= 0 && optimisticVote < poll.options.length) {
        // Only add if user hasn't voted yet in actual data
        if (poll.votes[user.uid] === undefined) {
          counts[optimisticVote]++;
        }
      }
    }
    return counts;
  };

  const getTotalVotes = (poll: IPoll): number => {
    return Object.keys(poll.votes).length;
  };

  const getPercentage = (count: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const activePolls = polls.filter((p) => p.isActive);
  const pastPolls = polls.filter((p) => !p.isActive);

  return (
    <section className="mb-10">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-dark-green dark:text-light-green rounded-lg">
              <BarChart3 size={28} />
            </div>
            <h2 className="text-3xl font-serif font-bold text-neutral-900 dark:text-white">
              Polls
            </h2>
            <span className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
              {activePolls.length} active
            </span>
          </div>
          {isCreator && (
            <Button
              onClick={() => setIsCreatingPoll(true)}
              className="bg-dark-green dark:bg-light-green text-white hover:opacity-90"
            >
              <Plus size={18} className="mr-2" />
              Create Poll
            </Button>
          )}
        </div>

        {activePolls.length === 0 && pastPolls.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            <BarChart3 size={48} className="mx-auto mb-3 opacity-20" />
            <p>No polls yet.</p>
            {isCreator && (
              <p className="text-sm mt-2">
                Create polls to vote on next book, meetup times, or discussion
                topics!
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {activePolls.map((poll) => {
              const userVote = getUserVote(poll);
              const voteCounts = getVoteCounts(poll);
              const totalVotes = getTotalVotes(poll);

              return (
                <div
                  key={poll.id}
                  className="p-6 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-dark-green dark:text-light-green bg-dark-green/10 dark:bg-light-green/20 px-2 py-1 rounded uppercase">
                          {poll.type.replace("-", " ")}
                        </span>
                        {poll.endDate && (
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            Ends {new Date(poll.endDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                        {poll.question}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {poll.options.map((option, index) => {
                      const count = voteCounts[index];
                      const percentage = getPercentage(count, totalVotes);
                      const isSelected = userVote === index;

                      return (
                        <div key={index} className="space-y-1">
                          <button
                            onClick={() => handleVote(poll.id, index)}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                              isSelected
                                ? "border-dark-green dark:border-light-green bg-dark-green/10 dark:bg-light-green/20 hover:bg-dark-green/20 dark:hover:bg-light-green/30"
                                : userVote !== null
                                ? "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-dark-green dark:hover:border-light-green"
                                : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-dark-green dark:hover:border-light-green"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                {isSelected && (
                                  <CheckCircle2
                                    size={18}
                                    className="text-dark-green dark:text-light-green shrink-0"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-neutral-900 dark:text-white">
                                    {option.text}
                                  </p>
                                  {option.bookData && (
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                      by{" "}
                                      {option.bookData.volumeInfo.authors?.join(
                                        ", "
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {userVote !== null && (
                                <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                                  {percentage}%
                                </span>
                              )}
                            </div>
                          </button>
                          {userVote !== null && (
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  isSelected
                                    ? "bg-dark-green dark:bg-light-green"
                                    : "bg-neutral-400 dark:bg-neutral-600"
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {pastPolls.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Past Polls
                </h3>
                <div className="space-y-4">
                  {pastPolls.map((poll) => {
                    const voteCounts = getVoteCounts(poll);
                    const totalVotes = getTotalVotes(poll);
                    const winningIndex = voteCounts.indexOf(
                      Math.max(...voteCounts)
                    );

                    return (
                      <div
                        key={poll.id}
                        className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 opacity-75"
                      >
                        <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
                          {poll.question}
                        </h4>
                        <div className="space-y-1">
                          {poll.options.map((option, index) => (
                            <div
                              key={index}
                              className={`text-sm p-2 rounded ${
                                index === winningIndex
                                  ? "bg-dark-green/20 dark:bg-light-green/20 text-dark-green dark:text-light-green font-semibold"
                                  : "text-neutral-600 dark:text-neutral-400"
                              }`}
                            >
                              {option.text} - {voteCounts[index]} votes (
                              {getPercentage(voteCounts[index], totalVotes)}%)
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Poll Dialog */}
      {isCreatingPoll && (
        <Dialog open={true} onOpenChange={() => setIsCreatingPoll(false)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-black dark:text-white">
                Create Poll
              </DialogTitle>
              <DialogDescription className="text-neutral-600 dark:text-neutral-400">
                Create a poll for members to vote on
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-black dark:text-white">Poll Type</Label>
                <Select
                  value={newPoll.type}
                  onValueChange={(value: any) =>
                    setNewPoll({ ...newPoll, type: value, options: [] })
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-neutral-900 text-black dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="book-selection">
                      Book Selection
                    </SelectItem>
                    <SelectItem value="meetup">Meetup Time</SelectItem>
                    <SelectItem value="topic">Discussion Topic</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                    value={newPoll.question}
                    onChange={(e) =>
                      setNewPoll({ ...newPoll, question: e.target.value })
                    }
                    maxLength={RATE_LIMITS.MAX_POLL_QUESTION_LENGTH}
                    className="bg-white dark:bg-neutral-900 text-black dark:text-white"
                    placeholder="What would you like members to vote on?"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400 dark:text-neutral-500">
                    {newPoll.question.length}/
                    {RATE_LIMITS.MAX_POLL_QUESTION_LENGTH}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-black dark:text-white">
                  Options * (at least 2 required)
                </Label>
                {newPoll.type === "book-selection" ? (
                  <div className="space-y-2">
                    <BookSearch
                      onBookSelect={(book) => {
                        // Convert BookSearch Book to IBookOfTheMonth
                        const bookData: IBookOfTheMonth = {
                          id: book.id,
                          volumeInfo: {
                            title: book.volumeInfo.title,
                            authors: book.volumeInfo.authors,
                            description: book.volumeInfo.description,
                            imageLinks: book.volumeInfo.imageLinks
                              ? {
                                  thumbnail:
                                    book.volumeInfo.imageLinks.thumbnail || "",
                                }
                              : undefined,
                          },
                        };
                        setSelectedBookForOption(bookData);
                      }}
                    />
                    {selectedBookForOption && (
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {selectedBookForOption.volumeInfo.title}
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          by{" "}
                          {selectedBookForOption.volumeInfo.authors?.join(", ")}
                        </p>
                        <Button
                          size="sm"
                          onClick={handleAddOption}
                          className="mt-2 bg-dark-green dark:bg-light-green text-white hover:opacity-90"
                        >
                          Add Book
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={newOptionText}
                        onChange={(e) => setNewOptionText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddOption();
                          }
                        }}
                        maxLength={RATE_LIMITS.MAX_POLL_OPTION_LENGTH}
                        className="bg-white dark:bg-neutral-900 text-black dark:text-white"
                        placeholder="Enter option text"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400 dark:text-neutral-500">
                        {newOptionText.length}/
                        {RATE_LIMITS.MAX_POLL_OPTION_LENGTH}
                      </div>
                    </div>
                    <Button
                      onClick={handleAddOption}
                      className="bg-dark-green dark:bg-light-green text-white hover:opacity-90"
                    >
                      Add
                    </Button>
                  </div>
                )}

                <div className="space-y-2 mt-2">
                  {newPoll.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700"
                    >
                      <span className="text-sm text-neutral-900 dark:text-white">
                        {option.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-600 dark:text-red-400"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-black dark:text-white">
                  End Date (Optional)
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newPoll.endDate}
                  onChange={(e) =>
                    setNewPoll({ ...newPoll, endDate: e.target.value })
                  }
                  className="bg-white dark:bg-neutral-900 text-black dark:text-white"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded text-sm">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatingPoll(false);
                  setError(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePoll}
                disabled={
                  isSaving ||
                  newPoll.options.length < 2 ||
                  newPoll.question.length >
                    RATE_LIMITS.MAX_POLL_QUESTION_LENGTH ||
                  newPoll.options.length > RATE_LIMITS.MAX_POLL_OPTIONS ||
                  newPoll.options.some(
                    (opt) =>
                      opt.text.length > RATE_LIMITS.MAX_POLL_OPTION_LENGTH
                  )
                }
                className="bg-dark-green dark:bg-light-green text-white hover:opacity-90"
              >
                {isSaving ? "Creating..." : "Create Poll"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
};

export default PollsSection;
