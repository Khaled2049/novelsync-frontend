import React, { useState, useEffect } from "react";
import { Calendar, Edit, Save, X, Plus } from "lucide-react";
import { IReadingSchedule, IChapterSchedule, IClub } from "@/types/IClub";
import { bookClubRepo } from "../bookClubRepo";
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

interface ReadingScheduleSectionProps {
  club: IClub;
  isCreator: boolean;
}

const ReadingScheduleSection: React.FC<ReadingScheduleSectionProps> = ({
  club,
  isCreator,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const schedule = club.readingSchedule || null;
  const [startDate, setStartDate] = useState<string>("");
  const [pacingType, setPacingType] = useState<
    "chapters-per-week" | "chapters-per-days" | "custom"
  >("chapters-per-week");
  const [pacingValue, setPacingValue] = useState<number>(2);
  const [totalChapters, setTotalChapters] = useState<number>(20);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (schedule) {
      setStartDate(schedule.startDate);
      setPacingType(schedule.pacing.type);
      setPacingValue(schedule.pacing.value);
      setTotalChapters(schedule.totalChapters || 20);
    }
  }, [schedule]);

  const calculateSchedule = () => {
    if (!startDate) return [];

    const start = new Date(startDate);
    const chapters: IChapterSchedule[] = [];
    let currentDate = new Date(start);

    for (let i = 1; i <= totalChapters; i++) {
      chapters.push({
        chapterNumber: i,
        scheduledDate: currentDate.toISOString().split("T")[0],
      });

      // Calculate next date based on pacing
      if (pacingType === "chapters-per-week") {
        // e.g., 2 chapters per week = every 3.5 days
        const daysPerChapter = 7 / pacingValue;
        currentDate = new Date(
          currentDate.getTime() + daysPerChapter * 24 * 60 * 60 * 1000
        );
      } else if (pacingType === "chapters-per-days") {
        // e.g., 3 days per chapter
        currentDate = new Date(
          currentDate.getTime() + pacingValue * 24 * 60 * 60 * 1000
        );
      } else {
        // Custom - default to 1 week per chapter
        currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
    }

    return chapters;
  };

  const handleSave = async () => {
    if (!startDate) {
      setError("Please select a start date");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const chapters = calculateSchedule();
      const newSchedule: IReadingSchedule = {
        startDate,
        pacing: {
          type: pacingType,
          value: pacingValue,
        },
        chapters,
        totalChapters,
      };

      // Optimistic update - the real-time listener will update with server data
      if (schedule) {
        await bookClubRepo.updateReadingSchedule(club.id, newSchedule);
      } else {
        await bookClubRepo.createReadingSchedule(club.id, newSchedule);
      }

      setIsEditing(false);
    } catch (err: any) {
      console.error("Error saving schedule:", err);
      setError(err.message || "Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusForChapter = (chapterDate: string) => {
    const today = new Date();
    const scheduledDate = new Date(chapterDate);
    today.setHours(0, 0, 0, 0);
    scheduledDate.setHours(0, 0, 0, 0);

    if (scheduledDate < today) return "past";
    if (scheduledDate.getTime() === today.getTime()) return "current";
    return "upcoming";
  };

  if (!schedule && !isEditing) {
    if (!isCreator) {
      return null;
    }
    return (
      <section className="mb-10">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-dark-green dark:text-light-green rounded-lg">
                <Calendar size={28} />
              </div>
              <h2 className="text-3xl font-serif font-bold text-neutral-900 dark:text-white">
                Reading Schedule
              </h2>
            </div>
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-dark-green dark:bg-light-green text-white hover:opacity-90"
            >
              <Plus size={18} className="mr-2" />
              Create Schedule
            </Button>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            No reading schedule has been set up yet.
          </p>
        </div>
      </section>
    );
  }

  if (isEditing && isCreator) {
    return (
      <section className="mb-10">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-serif font-bold text-neutral-900 dark:text-white flex items-center gap-3">
              <Calendar
                className="text-dark-green dark:text-light-green"
                size={28}
              />
              Reading Schedule
            </h2>
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditing(false);
                setError(null);
              }}
            >
              <X size={18} />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="startDate"
                  className="text-black dark:text-white"
                >
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white dark:bg-neutral-900 text-black dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="totalChapters"
                  className="text-black dark:text-white"
                >
                  Total Chapters
                </Label>
                <Input
                  id="totalChapters"
                  type="number"
                  min="1"
                  value={totalChapters}
                  onChange={(e) =>
                    setTotalChapters(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="bg-white dark:bg-neutral-900 text-black dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-black dark:text-white">Pacing</Label>
              <Select
                value={pacingType}
                onValueChange={(value: any) => setPacingType(value)}
              >
                <SelectTrigger className="bg-white dark:bg-neutral-900 text-black dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chapters-per-week">
                    Chapters per Week
                  </SelectItem>
                  <SelectItem value="chapters-per-days">
                    Days per Chapter
                  </SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="pacingValue"
                className="text-black dark:text-white"
              >
                {pacingType === "chapters-per-week"
                  ? "Chapters per Week"
                  : pacingType === "chapters-per-days"
                  ? "Days per Chapter"
                  : "Weeks per Chapter"}
              </Label>
              <Input
                id="pacingValue"
                type="number"
                min="1"
                value={pacingValue}
                onChange={(e) =>
                  setPacingValue(Math.max(1, parseFloat(e.target.value) || 1))
                }
                className="bg-white dark:bg-neutral-900 text-black dark:text-white"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-dark-green dark:bg-light-green text-white hover:opacity-90"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Save Schedule
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!schedule) return null;

  return (
    <section className="mb-10">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-dark-green dark:text-light-green rounded-lg">
              <Calendar size={28} />
            </div>
            <h2 className="text-3xl font-serif font-bold text-neutral-900 dark:text-white">
              Reading Schedule
            </h2>
          </div>
          {isCreator && (
            <Button
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="text-neutral-600 dark:text-neutral-400"
            >
              <Edit size={18} />
            </Button>
          )}
        </div>

        <div className="mb-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold">Pacing:</span>{" "}
            {schedule.pacing.type === "chapters-per-week"
              ? `${schedule.pacing.value} chapters per week`
              : schedule.pacing.type === "chapters-per-days"
              ? `${schedule.pacing.value} days per chapter`
              : "Custom schedule"}
          </p>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {schedule.chapters.map((chapter, index) => {
            const status = getStatusForChapter(chapter.scheduledDate);
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-colors ${
                  status === "current"
                    ? "bg-dark-green/10 dark:bg-light-green/20 border-dark-green dark:border-light-green"
                    : status === "past"
                    ? "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 opacity-60"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        status === "current"
                          ? "bg-dark-green dark:bg-light-green text-white"
                          : status === "past"
                          ? "bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-300"
                          : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {chapter.chapterNumber}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        Chapter {chapter.chapterNumber}
                        {chapter.chapterTitle && `: ${chapter.chapterTitle}`}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {formatDate(chapter.scheduledDate)}
                      </p>
                    </div>
                  </div>
                  {status === "current" && (
                    <span className="px-2 py-1 bg-dark-green dark:bg-light-green text-white text-xs font-semibold rounded">
                      Current
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ReadingScheduleSection;
