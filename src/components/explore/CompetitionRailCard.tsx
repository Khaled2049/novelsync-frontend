import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CompetitionCover } from "./CompetitionCover";
import { formatCountdown } from "@/hooks/useCountdown";
import { getPrizeDisplay, hasJoinedWithoutSubmitting } from "@/lib/competitionListing";
import type { ICompetition } from "@/types/ICompetition";

export interface CompetitionRailCardProps {
  competition: ICompetition;
  now: number;
}

export function CompetitionRailCard({ competition, now }: CompetitionRailCardProps) {
  const prize = getPrizeDisplay(competition);
  const countdown = formatCountdown(competition.deadline, now);
  const joined = hasJoinedWithoutSubmitting(competition);

  const metaLine = joined
    ? `Joined · ${competition.participants}${competition.maxParticipants ? `/${competition.maxParticipants}` : ""} entered`
    : `Free · ${competition.participants}${competition.maxParticipants ? `/${competition.maxParticipants}` : ""} entered`;

  return (
    <Link
      to={`/explore/competitions/${competition.id}`}
      className={cn(
        "group flex w-[78vw] sm:w-[262px] shrink-0 flex-col gap-3 rounded-ns-lg border border-ns-border bg-ns-surface p-[18px]",
        "transition-all duration-150 ease-ns-smooth hover:-translate-y-0.5 hover:border-ns-border-strong hover:shadow-ns-lg",
        "motion-reduce:hover:translate-y-0",
      )}
    >
      <CompetitionCover competition={competition} size="rail" />
      <h3 className="font-heading text-[22px] leading-[1.15] text-ns-ink line-clamp-2">
        {competition.title}
      </h3>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-heading text-[26px] leading-none text-ns-gold-bright">
          {prize.amount}
        </span>
        <span
          className={cn(
            "font-ui text-xs font-semibold whitespace-nowrap",
            countdown.isUrgent ? "text-ns-accent" : "text-ns-ink-secondary",
          )}
        >
          {countdown.isPast ? "Closed" : countdown.label}
        </span>
      </div>
      <p className="font-ui text-xs text-ns-ink-muted">{metaLine}</p>
    </Link>
  );
}

export default CompetitionRailCard;
