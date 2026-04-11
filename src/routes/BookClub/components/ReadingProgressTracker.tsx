import React, { useState, useEffect } from "react";
import { BookOpen, TrendingUp, Edit } from "lucide-react";
import { IReadingProgress } from "@/types/IClub";
import { bookClubRepo } from "../bookClubRepo";
import { useAuthContext } from "@/contexts/AuthContext";
import ProgressUpdateModal from "./ProgressUpdateModal";

interface ReadingProgressTrackerProps {
  clubId: string;
  members: Array<{ id: string; username: string }>;
  currentUserChapter?: number;
}

const ReadingProgressTracker: React.FC<ReadingProgressTrackerProps> = ({
  clubId,
  members,
  currentUserChapter,
}) => {
  const { user } = useAuthContext();
  const [progress, setProgress] = useState<IReadingProgress[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) return;

    const unsubscribe = bookClubRepo.getAllMemberProgress(clubId, (data) => {
      // Merge with member usernames
      const enrichedProgress = data.map((p) => {
        const member = members.find((m) => m.id === p.userId);
        return {
          ...p,
          username: member?.username || "Unknown User",
        };
      });
      setProgress(enrichedProgress);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clubId, members]);

  const sortedProgress = [...progress].sort(
    (a, b) => b.currentChapter - a.currentChapter,
  );

  return (
    <>
      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <TrendingUp
              size={18}
              className="text-dark-green dark:text-light-green"
            />
            Reading Progress
          </h3>
          {user && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
              title="Update your progress"
            >
              <Edit
                size={16}
                className="text-neutral-600 dark:text-neutral-400"
              />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-dark-green dark:border-light-green border-t-transparent animate-spin rounded-full"></div>
          </div>
        ) : sortedProgress.length === 0 ? (
          <div className="text-center py-4 text-neutral-500 dark:text-neutral-400 text-sm">
            No progress tracked yet
          </div>
        ) : (
          <div className="space-y-3 px-2">
            {sortedProgress.map((p) => {
              const isCurrentUser = user && p.userId === user.uid;
              return (
                <div
                  key={p.userId}
                  className={`p-3 rounded-lg border transition-colors ${
                    isCurrentUser
                      ? "bg-dark-green/10 dark:bg-light-green/20 border-dark-green/30 dark:border-light-green/30"
                      : "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen
                        size={14}
                        className={`${
                          isCurrentUser
                            ? "text-dark-green dark:text-light-green"
                            : "text-neutral-500 dark:text-neutral-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium truncate ${
                          isCurrentUser
                            ? "text-dark-green dark:text-light-green"
                            : "text-neutral-900 dark:text-white"
                        }`}
                      >
                        {p.username}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      Ch. {p.currentChapter}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        isCurrentUser
                          ? "bg-dark-green dark:bg-light-green"
                          : "bg-neutral-400 dark:bg-neutral-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (p.currentChapter / 50) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && user && (
        <ProgressUpdateModal
          clubId={clubId}
          userId={user.uid}
          currentChapter={currentUserChapter || 0}
          onClose={() => setIsModalOpen(false)}
          onUpdate={() => {
            setIsModalOpen(false);
            // Progress will update automatically via real-time listener
          }}
        />
      )}
    </>
  );
};

export default ReadingProgressTracker;
