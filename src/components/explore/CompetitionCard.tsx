import { Users, Trophy, Clock, Tag } from "lucide-react";
import { ICompetition, CompetitionStatus } from "@/types/ICompetition";
import SponsorBadge from "./SponsorBadge";

const formatTimeRemaining = (deadline: Date): string => {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff < 0) {
    return "Ended";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `in ${days} day${days !== 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `in ${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (minutes > 0) {
    return `in ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else {
    return "ending soon";
  }
};

interface CompetitionCardProps {
  competition: ICompetition;
  onJoin: (competitionId: string) => void;
}

const getStatusBadgeColor = (status: CompetitionStatus) => {
  switch (status) {
    case "active":
      return "bg-green-500 text-white";
    case "upcoming":
      return "bg-blue-500 text-white";
    case "completed":
      return "bg-gray-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "intermediate":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "advanced":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

const CompetitionCard: React.FC<CompetitionCardProps> = ({
  competition,
  onJoin,
}) => {
  const isActive = competition.status === "active";
  const isUpcoming = competition.status === "upcoming";
  const isCompleted = competition.status === "completed";
  const canJoin = isActive || isUpcoming;

  const timeRemaining = formatTimeRemaining(competition.deadline);

  return (
    <div
      className={`group relative bg-white dark:bg-neutral-900 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
        isActive
          ? "border-dark-green dark:border-light-green"
          : "border-gray-200 dark:border-neutral-700"
      } ${isCompleted ? "opacity-75" : ""}`}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusBadgeColor(
            competition.status
          )}`}
        >
          {competition.status}
        </span>
      </div>

      <div className="p-6">
        {/* Sponsor Badge */}
        {competition.sponsor && (
          <div className="mb-4">
            <SponsorBadge sponsor={competition.sponsor} variant="compact" />
          </div>
        )}

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-black dark:text-white pr-16 group-hover:text-dark-green dark:group-hover:text-light-green transition-colors">
              {competition.title}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {competition.description}
          </p>
        </div>

        {/* Prize Amount */}
        <div className="mb-4 p-4 bg-gradient-to-r from-dark-green/10 to-light-green/10 dark:from-dark-green/20 dark:to-light-green/20 rounded-lg border border-dark-green/20 dark:border-light-green/20">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-dark-green dark:text-light-green" />
            <div>
              <div className="text-2xl font-bold text-dark-green dark:text-light-green">
                {competition.prizeAmount.toLocaleString()}{" "}
                {competition.prizeCurrency}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Total Prize Pool
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Deadline */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">
                {isCompleted ? "Ended" : "Ends"}
              </div>
              <div className="font-semibold text-black dark:text-white">
                {timeRemaining}
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">
                Participants
              </div>
              <div className="font-semibold text-black dark:text-white">
                {competition.participants.toLocaleString()}
                {competition.maxParticipants &&
                  ` / ${competition.maxParticipants.toLocaleString()}`}
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {competition.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-md"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {competition.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-md">
              +{competition.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${getDifficultyColor(
                competition.difficulty
              )}`}
            >
              {competition.difficulty}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              by {competition.organizer}
            </span>
          </div>

          {/* Join Button */}
          {canJoin ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJoin(competition.id);
              }}
              className="px-4 py-2 bg-gradient-to-r from-dark-green to-light-green text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              {isUpcoming ? "Register" : "Join"}
            </button>
          ) : (
            <button
              disabled
              className="px-4 py-2 bg-gray-300 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 rounded-lg font-semibold text-sm cursor-not-allowed"
            >
              Completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitionCard;
