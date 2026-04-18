import { IMessage } from "@/types/IMessage";
import { useEffect, useRef, useState } from "react";
import { bookClubRepo } from "./bookClubRepo";
import { Send, AlertTriangle } from "lucide-react";
import { IUser } from "@/types/IUser";
import SpoilerTag from "./components/SpoilerTag";
import { ISpoilerTag } from "@/types/IClub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RATE_LIMITS } from "@/config/rateLimits";
import { rateLimitService } from "@/services/RateLimitService";

interface BookClubChatProps {
  clubId: string;
  user: IUser;
  userCurrentChapter?: number;
}

const BookClubChat: React.FC<BookClubChatProps> = ({
  clubId,
  user,
  userCurrentChapter = 0,
}) => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSpoilerDialogOpen, setIsSpoilerDialogOpen] = useState(false);
  const [spoilerContent, setSpoilerContent] = useState("");
  const [spoilerStartChapter, setSpoilerStartChapter] = useState<number>(1);
  const [spoilerEndChapter, setSpoilerEndChapter] = useState<
    number | undefined
  >();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { displayName } = user;
  const maxMessageLength = RATE_LIMITS.MAX_MESSAGE_SIZE_CHARS;

  useEffect(() => {
    // Subscribe to messages
    const unsubscribe = bookClubRepo.getMessages(clubId, (updatedMessages) => {
      setMessages(updatedMessages);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [clubId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newMessage.trim()) return;

    // Validate message length
    if (newMessage.length > maxMessageLength) {
      setErrorMessage(
        `Message is too long. Maximum ${maxMessageLength} characters allowed.`,
      );
      return;
    }

    // Check rate limits
    const rateLimitCheck = await rateLimitService.canSendMessage(user.uid);
    if (!rateLimitCheck.allowed) {
      setErrorMessage(rateLimitCheck.message || "Rate limit exceeded");
      return;
    }

    // Check if user is member of the club
    const isMember = await bookClubRepo.checkMembership(clubId, user.uid);
    if (!isMember) {
      setErrorMessage("You must be a member to send messages");
      return;
    }

    try {
      const message: IMessage = {
        content: newMessage.trim(),
        sender: displayName || "Anonymous",
        senderId: user.uid,
      };

      await bookClubRepo.sendMessage(clubId, message);
      await rateLimitService.incrementMessageCount(user.uid);
      setNewMessage("");
      setErrorMessage(null);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setErrorMessage(error.message || "Failed to send message");
    }
  };

  const handleSendSpoiler = async () => {
    if (!spoilerContent.trim()) return;

    // Validate message length
    if (spoilerContent.length > maxMessageLength) {
      setErrorMessage(
        `Message is too long. Maximum ${maxMessageLength} characters allowed.`,
      );
      return;
    }

    // Check rate limits
    const rateLimitCheck = await rateLimitService.canSendMessage(user.uid);
    if (!rateLimitCheck.allowed) {
      setErrorMessage(rateLimitCheck.message || "Rate limit exceeded");
      return;
    }

    // Check if user is member of the club
    const isMember = await bookClubRepo.checkMembership(clubId, user.uid);
    if (!isMember) {
      setErrorMessage("You must be a member to send messages");
      return;
    }

    try {
      const message: IMessage = {
        content: spoilerContent.trim(),
        sender: displayName || "Anonymous",
        senderId: user.uid,
        hasSpoiler: true,
        spoilerChapterRange: {
          start: spoilerStartChapter,
          ...(spoilerEndChapter !== undefined && { end: spoilerEndChapter }),
        },
      };

      await bookClubRepo.sendMessage(clubId, message);
      await rateLimitService.incrementMessageCount(user.uid);
      setSpoilerContent("");
      setSpoilerStartChapter(1);
      setSpoilerEndChapter(undefined);
      setIsSpoilerDialogOpen(false);
      setErrorMessage(null);
    } catch (error: any) {
      console.error("Error sending spoiler message:", error);
      setErrorMessage(error.message || "Failed to send spoiler message");
    }
  };

  const renderMessageContent = (message: IMessage) => {
    if (message.hasSpoiler && message.spoilerChapterRange) {
      const spoiler: ISpoilerTag = {
        content: message.content,
        chapterRange: message.spoilerChapterRange,
      };
      return (
        <SpoilerTag
          spoiler={spoiler}
          userCurrentChapter={userCurrentChapter}
          className="w-full"
        />
      );
    }
    return <p className="break-words leading-relaxed">{message.content}</p>;
  };

  return (
    <div className="space-y-4">
      {/* Messages Container */}
      <div className="h-96 overflow-y-auto rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-gradient-to-br from-neutral-50/30 to-neutral-100/30 dark:from-neutral-900/30 dark:to-neutral-800/30 p-4 space-y-3 scrollbar-thin scrollbar-thumb-dark-green/30 dark:scrollbar-thumb-light-green/30 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <p className="text-center text-neutral-400 dark:text-neutral-500 italic py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === user?.uid ? "justify-end" : "justify-start"
              } animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[75%] sm:max-w-[65%] p-3 rounded-2xl shadow-md ${
                  message.senderId === user?.uid
                    ? "bg-gradient-to-r from-dark-green to-emerald-600 dark:from-light-green dark:to-emerald-500 text-white rounded-br-sm"
                    : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-sm"
                }`}
              >
                <p
                  className={`text-xs font-semibold mb-1 ${
                    message.senderId === user?.uid
                      ? "text-white/90"
                      : "text-dark-green dark:text-light-green"
                  }`}
                >
                  {message.sender}
                  {message.hasSpoiler && (
                    <span className="ml-2 text-yellow-500 dark:text-yellow-400">
                      <AlertTriangle size={12} className="inline" />
                    </span>
                  )}
                </p>
                {renderMessageContent(message)}
                <p
                  className={`text-xs mt-1 ${
                    message.senderId === user?.uid
                      ? "text-white/70"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {message.timestamp?.toDate().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="space-y-2">
        {errorMessage && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Type your message..."
              maxLength={maxMessageLength}
              className="w-full p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:border-transparent transition-all duration-200"
            />
            <div className="absolute right-2 bottom-1 text-xs text-neutral-400 dark:text-neutral-500">
              {newMessage.length}/{maxMessageLength}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSpoilerDialogOpen(true)}
            className="px-3 sm:px-4 py-3 sm:py-4 border border-dark-green/30 dark:border-light-green/30 rounded-xl bg-dark-green/10 dark:bg-light-green/10 text-dark-green dark:text-light-green hover:bg-dark-green/20 dark:hover:bg-light-green/20 transition-colors"
            title="Add spoiler"
          >
            <AlertTriangle size={18} />
          </button>
          <button
            type="submit"
            disabled={
              !newMessage.trim() || newMessage.length > maxMessageLength
            }
            className="bg-gradient-to-r from-dark-green to-emerald-600 dark:from-light-green dark:to-emerald-500 hover:from-dark-green/90 hover:to-emerald-600/90 dark:hover:from-light-green/90 dark:hover:to-emerald-500/90 disabled:from-neutral-300 disabled:to-neutral-400 dark:disabled:from-neutral-600 dark:disabled:to-neutral-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
          >
            <span className="hidden sm:inline">Send</span>
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Spoiler Dialog */}
      <Dialog open={isSpoilerDialogOpen} onOpenChange={setIsSpoilerDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black dark:text-white">
              <AlertTriangle
                className="text-dark-green dark:text-light-green"
                size={20}
              />
              Add Spoiler Message
            </DialogTitle>
            <DialogDescription className="text-neutral-600 dark:text-neutral-400">
              Tag your message with a chapter range to prevent spoilers for
              members who haven't reached that point yet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {errorMessage && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {errorMessage}
              </div>
            )}
            <div className="space-y-2">
              <Label
                htmlFor="spoilerContent"
                className="text-black dark:text-white"
              >
                Message *
              </Label>
              <div className="relative">
                <textarea
                  id="spoilerContent"
                  value={spoilerContent}
                  onChange={(e) => {
                    setSpoilerContent(e.target.value);
                    setErrorMessage(null);
                  }}
                  maxLength={maxMessageLength}
                  className="w-full p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-black dark:text-white min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green"
                  placeholder="Enter your spoiler message..."
                />
                <div className="absolute right-2 bottom-2 text-xs text-neutral-400 dark:text-neutral-500">
                  {spoilerContent.length}/{maxMessageLength}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="startChapter"
                  className="text-black dark:text-white"
                >
                  Start Chapter *
                </Label>
                <Input
                  id="startChapter"
                  type="number"
                  min="1"
                  value={spoilerStartChapter}
                  onChange={(e) =>
                    setSpoilerStartChapter(
                      Math.max(1, parseInt(e.target.value) || 1),
                    )
                  }
                  className="bg-white dark:bg-neutral-900 text-black dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="endChapter"
                  className="text-black dark:text-white"
                >
                  End Chapter (Optional)
                </Label>
                <Input
                  id="endChapter"
                  type="number"
                  min="1"
                  value={spoilerEndChapter || ""}
                  onChange={(e) =>
                    setSpoilerEndChapter(
                      e.target.value
                        ? Math.max(1, parseInt(e.target.value) || 1)
                        : undefined,
                    )
                  }
                  className="bg-white dark:bg-neutral-900 text-black dark:text-white"
                  placeholder="Leave empty for single chapter"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSpoilerDialogOpen(false);
                setSpoilerContent("");
                setSpoilerStartChapter(1);
                setSpoilerEndChapter(undefined);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendSpoiler}
              disabled={
                !spoilerContent.trim() ||
                spoilerContent.length > maxMessageLength
              }
              className="bg-dark-green dark:bg-light-green text-white hover:opacity-90"
            >
              <AlertTriangle size={16} className="mr-2" />
              Send Spoiler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookClubChat;
