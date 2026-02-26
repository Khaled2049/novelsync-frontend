import { ICompetition, CompetitionStatus } from "@/types/ICompetition";

const formatTimeRemaining = (deadline: Date): string => {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff < 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;
  if (minutes > 0) return `${minutes}m left`;
  return "ending soon";
};

const statusMeta: Record<
  CompetitionStatus,
  { label: string; dotClass: string; barClass: string }
> = {
  active: {
    label: "Active",
    dotClass: "bg-dark-green dark:bg-light-green animate-pulse",
    barClass: "bg-dark-green dark:bg-light-green",
  },
  upcoming: {
    label: "Upcoming",
    dotClass: "bg-amber-500",
    barClass: "bg-amber-500",
  },
  completed: {
    label: "Closed",
    dotClass: "bg-neutral-400 dark:bg-neutral-600",
    barClass: "bg-neutral-400",
  },
};

const difficultyLabel: Record<string, string> = {
  beginner: "text-emerald-600 dark:text-emerald-400",
  intermediate: "text-amber-600 dark:text-amber-400",
  advanced: "text-red-500 dark:text-red-400",
};

interface CompetitionCardProps {
  competition: ICompetition;
  onJoin: (competitionId: string) => void;
}

const CompetitionCard: React.FC<CompetitionCardProps> = ({
  competition,
  onJoin,
}) => {
  const { status, difficulty } = competition;
  const isCompleted = status === "completed";
  const canJoin = status === "active" || status === "upcoming";
  const meta = statusMeta[status];
  const timeRemaining = formatTimeRemaining(competition.deadline);

  const participantPct =
    competition.maxParticipants && competition.maxParticipants > 0
      ? Math.min(
          (competition.participants / competition.maxParticipants) * 100,
          100
        )
      : null;

  return (
    <article
      className={`group relative border-b border-neutral-200 dark:border-neutral-800 py-8 md:py-10 transition-colors duration-300 ${
        isCompleted ? "opacity-60" : ""
      }`}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-0 h-full w-[2px] origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${meta.barClass}`}
      />

      <div className="flex items-start gap-5 md:gap-8 pl-5 md:pl-7">
        {/* Status dot */}
        <div className="shrink-0 pt-[0.65rem]">
          <span className={`block w-2 h-2 rounded-full ${meta.dotClass}`} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Overline: category · difficulty · status · sponsor */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-2">
            <p className="font-ui text-[10px] font-semibold tracking-[0.18em] uppercase text-dark-green dark:text-light-green">
              {competition.category}
            </p>
            <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
            <p
              className={`font-ui text-[10px] font-semibold tracking-[0.18em] uppercase ${
                difficultyLabel[difficulty] ?? "text-neutral-400"
              }`}
            >
              {difficulty}
            </p>
            <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
            <p className="font-ui text-[10px] font-semibold tracking-[0.18em] uppercase text-neutral-400 dark:text-neutral-600">
              {meta.label}
            </p>
            {competition.sponsor && (
              <>
                <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
                <p className="font-ui text-[10px] tracking-wide italic text-neutral-400 dark:text-neutral-600">
                  {competition.sponsor.tier} · {competition.sponsor.name}
                </p>
              </>
            )}
          </div>

          {/* Title */}
          <h2 className="font-heading text-2xl md:text-[2rem] font-light italic leading-[1.15] text-neutral-900 dark:text-neutral-50 mb-3 group-hover:text-dark-green dark:group-hover:text-light-green transition-colors duration-300">
            {competition.title}
          </h2>

          {/* Description */}
          <p className="font-body text-[0.9rem] text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2 max-w-2xl mb-5">
            {competition.description}
          </p>

          {/* Participant bar */}
          {participantPct !== null && (
            <div className="mb-5 max-w-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600">
                  {competition.participants.toLocaleString()} entered
                </span>
                <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600">
                  {competition.maxParticipants?.toLocaleString()} max
                </span>
              </div>
              <div className="h-[1px] w-full bg-neutral-200 dark:bg-neutral-800">
                <div
                  className={`h-full transition-all duration-700 ${meta.barClass}`}
                  style={{ width: `${participantPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[11px] font-ui text-neutral-400 dark:text-neutral-600">
            <span>
              {isCompleted ? "Closed" : `Closes ${timeRemaining}`}
            </span>
            <span className="w-[3px] h-[3px] rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <span>by {competition.organizer}</span>
            {competition.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="italic before:content-['·'] before:mr-4">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right: prize + action */}
        <div className="shrink-0 flex flex-col items-end justify-between gap-6 self-stretch py-1">
          {/* Prize */}
          <div className="text-right">
            <p className="font-ui text-[9px] font-bold tracking-[0.16em] uppercase text-neutral-400 dark:text-neutral-600 mb-1">
              {competition.prizeCurrency}
            </p>
            <p className="font-heading text-3xl md:text-4xl font-light italic text-neutral-900 dark:text-white leading-none">
              {competition.prizeAmount.toLocaleString()}
            </p>
          </div>

          {/* CTA */}
          <div>
            {canJoin ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin(competition.id);
                }}
                className="font-ui text-[11px] font-bold tracking-[0.12em] uppercase text-neutral-900 dark:text-white border border-neutral-900 dark:border-white px-4 py-2 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-colors duration-200 whitespace-nowrap"
              >
                {status === "upcoming" ? "Register" : "Enter →"}
              </button>
            ) : (
              <span className="font-ui text-[11px] font-semibold tracking-[0.12em] uppercase text-neutral-400 dark:text-neutral-600">
                Closed
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default CompetitionCard;
