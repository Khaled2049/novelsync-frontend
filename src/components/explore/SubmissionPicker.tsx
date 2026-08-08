import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { storiesRepo } from "@/services/StoriesRepo";

interface SubmissionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onPick: (storyId: string) => void;
  isSubmitting: boolean;
}

/**
 * Choose one of your own stories to enter.
 *
 * Only published stories are offered. `firestore.rules` exposes a story to
 * others only when `isPublished == true`, so an unpublished entry would be
 * invisible to every voter — the server rejects it too, but explaining it here
 * is better than surfacing a 422.
 */
const SubmissionPicker: React.FC<SubmissionPickerProps> = ({
  open,
  onOpenChange,
  userId,
  onPick,
  isSubmitting,
}) => {
  const { data: stories, isLoading } = useQuery({
    queryKey: [...queryKeys.user.stories(userId), "picker"] as const,
    queryFn: () => storiesRepo.getUserStories(userId),
    enabled: open,
  });

  const { published, unpublishedCount } = useMemo(() => {
    const all = stories ?? [];
    return {
      published: all.filter((story) => story.isPublished),
      unpublishedCount: all.filter((story) => !story.isPublished).length,
    };
  }, [stories]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading italic text-2xl font-light">
            Choose your entry
          </DialogTitle>
          <DialogDescription className="font-body text-sm">
            Pick one of your published stories. You can withdraw and change it
            until submissions close.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="font-body text-sm text-ns-ink-muted py-6">
            Loading your stories…
          </p>
        ) : published.length === 0 ? (
          <div className="py-6">
            <p className="font-body text-sm text-ns-ink-secondary">
              You have no published stories yet.
            </p>
            {unpublishedCount > 0 && (
              <p className="font-body text-sm text-ns-ink-muted mt-2">
                {unpublishedCount} unpublished{" "}
                {unpublishedCount === 1 ? "story" : "stories"} can't be entered —
                voters need to be able to read your entry.
              </p>
            )}
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto divide-y divide-ns-border">
            {published.map((story) => (
              <li key={story.id}>
                <button
                  type="button"
                  onClick={() => onPick(story.id)}
                  disabled={isSubmitting}
                  className="w-full text-left py-3 px-1 rounded-ns hover:bg-ns-surface transition-colors disabled:opacity-50"
                >
                  <span className="font-heading italic text-lg text-ns-ink block">
                    {story.title}
                  </span>
                  {story.description && (
                    <span className="font-body text-xs text-ns-ink-muted line-clamp-1 block mt-0.5">
                      {story.description}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionPicker;
