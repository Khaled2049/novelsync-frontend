import React, { useState } from "react";
import { BookOpen, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { bookClubRepo } from "../bookClubRepo";
import { rateLimitService } from "@/services/RateLimitService";

interface ProgressUpdateModalProps {
  clubId: string;
  userId: string;
  currentChapter: number;
  onClose: () => void;
  onUpdate: (chapter: number) => void;
}

const ProgressUpdateModal: React.FC<ProgressUpdateModalProps> = ({
  clubId,
  userId,
  currentChapter,
  onClose,
  onUpdate,
}) => {
  const [chapter, setChapter] = useState<number>(currentChapter || 1);
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (chapter < 1) {
      setError("Chapter must be at least 1");
      return;
    }

    // Check rate limits
    const rateLimitCheck = await rateLimitService.canUpdateReadingProgress(
      userId
    );
    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.message || "Rate limit exceeded");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await bookClubRepo.updateReadingProgress(
        clubId,
        userId,
        chapter,
        notes.trim() || undefined
      );

      // Increment progress update count
      await rateLimitService.incrementProgressUpdateCount(userId);

      onUpdate(chapter);
      onClose();
    } catch (err: any) {
      console.error("Error updating progress:", err);
      setError(err.message || "Failed to update progress");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black dark:text-white">
            <BookOpen
              className="text-dark-green dark:text-light-green"
              size={20}
            />
            Update Reading Progress
          </DialogTitle>
          <DialogDescription className="text-neutral-600 dark:text-neutral-400">
            Track your progress through the current book
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="chapter" className="text-black dark:text-white">
              Current Chapter
            </Label>
            <Input
              id="chapter"
              type="number"
              min="1"
              value={chapter}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                setChapter(Math.max(1, value));
              }}
              className="bg-white dark:bg-neutral-900 text-black dark:text-white"
              placeholder="Enter chapter number"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              What chapter are you currently on?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-black dark:text-white">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white dark:bg-neutral-900 text-black dark:text-white min-h-[100px]"
              placeholder="Add any notes about your reading progress..."
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
            onClick={onClose}
            disabled={isSaving}
            className="text-black dark:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-dark-green dark:bg-light-green text-white hover:opacity-90"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save size={16} />
                Save Progress
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressUpdateModal;
