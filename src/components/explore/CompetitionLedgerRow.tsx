import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatCountdown } from "@/hooks/useCountdown";
import {
  getHostName,
  getPrizeDisplay,
  hasJoinedWithoutSubmitting,
} from "@/lib/competitionListing";
import type { ICompetition } from "@/types/ICompetition";

export interface CompetitionLedgerRowProps {
  competition: ICompetition;
  now: number;
  canManage: boolean;
  onEdit: (competitionId: string) => void;
  onCancel: (competitionId: string) => void;
}

function rowState(competition: ICompetition, now: number) {
  const countdown = formatCountdown(competition.deadline, now);

  if (competition.phase === "settled") {
    return {
      subline: `Results announced · ${competition.category}`,
      urgent: false,
      dim: true,
      joined: false,
      action: "Results",
    };
  }
  if (competition.phase === "settling") {
    return {
      subline: `Judging · ${competition.category}`,
      urgent: false,
      dim: true,
      joined: false,
      action: "Judging",
    };
  }
  if (competition.phase === "cancelled") {
    return {
      subline: `Cancelled · ${competition.category}`,
      urgent: false,
      dim: true,
      joined: false,
      action: "Cancelled",
    };
  }
  if (competition.status === "completed") {
    // Legacy doc with no `phase` — fall back to the derived status only.
    return {
      subline: `Closed · ${competition.category}`,
      urgent: false,
      dim: true,
      joined: false,
      action: "Results",
    };
  }
  if (hasJoinedWithoutSubmitting(competition)) {
    return {
      subline: `Closes in ${countdown.label} · ${competition.category}`,
      urgent: countdown.isUrgent,
      dim: false,
      joined: true,
      action: "Continue",
    };
  }
  return {
    subline: `Closes in ${countdown.label} · ${competition.category}`,
    urgent: countdown.isUrgent,
    dim: false,
    joined: false,
    action: competition.status === "upcoming" ? "Register" : "Enter",
  };
}

export function CompetitionLedgerRow({
  competition,
  now,
  canManage,
  onEdit,
  onCancel,
}: CompetitionLedgerRowProps) {
  const prize = getPrizeDisplay(competition);
  const state = rowState(competition, now);
  const detailUrl = `/explore/competitions/${competition.id}`;
  const entrants = `${competition.participants}${
    competition.maxParticipants ? ` / ${competition.maxParticipants}` : ""
  }`;

  const actionPill = (
    <Badge
      variant={state.joined ? "outline" : state.dim ? "default" : "success"}
      className={cn(
        "pointer-events-none whitespace-nowrap",
        state.joined && "border-ns-accent/30 text-ns-accent",
      )}
    >
      {state.action}
    </Badge>
  );

  const manageButtons = canManage && (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onEdit(competition.id);
        }}
        className="relative z-20 pointer-events-auto font-ui text-[11px] font-semibold text-ns-ink-muted hover:text-ns-ink transition-colors"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onCancel(competition.id);
        }}
        className="relative z-20 pointer-events-auto font-ui text-[11px] font-semibold text-ns-destructive hover:text-ns-destructive-hover transition-colors"
      >
        Cancel
      </button>
    </div>
  );

  return (
    <div
      className={cn(
        "relative border-b border-ns-border py-[18px] px-1",
        "transition-colors duration-150 hover:bg-ns-surface-hover",
        state.dim && "opacity-[0.62]",
        state.joined && "bg-gradient-to-r from-ns-accent-subtle to-transparent",
      )}
    >
      <Link
        to={detailUrl}
        className="absolute inset-0 z-0"
        aria-label={competition.title}
      />

      {/* Desktop / tablet ledger row */}
      <div className="hidden md:grid grid-cols-[1.9fr_.8fr_.8fr_.9fr_auto] xl:grid-cols-[1.9fr_.9fr_.8fr_.8fr_.9fr_auto] items-center gap-x-5">
        <div className="relative z-10 pointer-events-none min-w-0">
          <p className="font-heading text-2xl leading-[1.05] text-ns-ink truncate">
            {competition.title}
          </p>
          <p
            className={cn(
              "font-ui text-xs mt-1",
              state.urgent ? "font-semibold text-ns-accent" : "text-ns-ink-muted",
            )}
          >
            {state.subline}
          </p>
        </div>

        <div className="hidden xl:block relative z-10 pointer-events-none font-ui text-sm text-ns-ink-secondary truncate">
          {getHostName(competition)}
        </div>

        <div className="relative z-10 pointer-events-none text-right font-heading text-[26px] text-ns-gold-bright">
          {prize.amount}
        </div>

        <div className="relative z-10 pointer-events-none text-right font-ui text-sm">
          <span className="font-semibold text-ns-success">Free</span>
        </div>

        <div className="relative z-10 pointer-events-none text-right font-ui text-sm text-ns-ink-secondary tabular-nums">
          {entrants}
        </div>

        <div className="relative z-10 flex items-center justify-end gap-3">
          {actionPill}
          {manageButtons}
        </div>
      </div>

      {/* Stacked card, narrow viewports */}
      <div className="md:hidden relative z-10 flex flex-col gap-2 pointer-events-none">
        <p className="font-heading text-2xl leading-[1.05] text-ns-ink">
          {competition.title}
        </p>
        <p
          className={cn(
            "font-ui text-xs",
            state.urgent ? "font-semibold text-ns-accent" : "text-ns-ink-muted",
          )}
        >
          {state.subline} · by {getHostName(competition)}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="font-heading text-2xl text-ns-gold-bright">
            {prize.amount}
          </span>
          <span className="font-ui text-xs text-ns-ink-secondary tabular-nums">
            {entrants} entered
          </span>
        </div>
        <div className="flex items-center justify-between mt-1 pointer-events-auto">
          {actionPill}
          {manageButtons}
        </div>
      </div>
    </div>
  );
}

export default CompetitionLedgerRow;
