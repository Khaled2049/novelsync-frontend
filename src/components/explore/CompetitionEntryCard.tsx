import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCountdown } from "@/hooks/useCountdown";
import type { ICompetition } from "@/types/ICompetition";

export interface CompetitionEntryCardProps {
  competition: ICompetition;
  now: number;
  phaseLabel: string;
  phaseBlurb: string;
  signedOut: boolean;
  isCreator: boolean;
  ctaLabel?: string;
  onCta?: () => void;
  ctaDisabled?: boolean;
}

function CountdownTile({ value, unit, accent }: { value: number; unit: string; accent?: boolean }) {
  return (
    <div className="flex-1 rounded-ns bg-ns-surface py-3 text-center">
      <p
        className={`font-heading text-[32px] leading-none tabular-nums ${accent ? "text-ns-accent" : "text-ns-ink"}`}
      >
        {value}
      </p>
      <p className="font-ui text-[10px] uppercase tracking-[0.14em] text-ns-ink-muted mt-1">
        {unit}
      </p>
    </div>
  );
}

export function CompetitionEntryCard({
  competition,
  now,
  phaseLabel,
  phaseBlurb,
  signedOut,
  isCreator,
  ctaLabel,
  onCta,
  ctaDisabled,
}: CompetitionEntryCardProps) {
  const countdown = formatCountdown(competition.deadline, now);
  const pct =
    competition.maxParticipants && competition.maxParticipants > 0
      ? Math.min(
          (competition.participants / competition.maxParticipants) * 100,
          100,
        )
      : null;

  return (
    <div className="rounded-[14px] border border-ns-border bg-ns-elevated overflow-hidden">
      <div className="p-[22px] border-b border-ns-border">
        <p className="font-ui text-[10px] uppercase tracking-[0.18em] text-ns-ink-muted mb-3">
          {countdown.isPast ? phaseLabel : "Closes in"}
        </p>
        {countdown.isPast ? (
          <p className="font-heading text-2xl text-ns-ink">{phaseLabel}</p>
        ) : (
          <div className="flex gap-2">
            {countdown.days > 0 ? (
              <>
                <CountdownTile value={countdown.days} unit="days" />
                <CountdownTile value={countdown.hours} unit="hrs" />
                <CountdownTile value={countdown.minutes} unit="min" accent />
              </>
            ) : (
              <>
                <CountdownTile value={countdown.hours} unit="hrs" />
                <CountdownTile value={countdown.minutes} unit="min" />
                <CountdownTile value={countdown.seconds} unit="sec" accent />
              </>
            )}
          </div>
        )}
      </div>

      <div className="p-[22px] flex flex-col gap-4">
        {competition.maxParticipants ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-ui text-[13px] text-ns-ink-muted">Entrants</span>
              <span className="font-ui text-[13px] font-semibold text-ns-ink tabular-nums">
                {competition.participants} / {competition.maxParticipants}
              </span>
            </div>
            {pct !== null && <Progress value={pct} />}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="font-ui text-[13px] text-ns-ink-muted">Entrants</span>
            <span className="font-ui text-[13px] font-semibold text-ns-ink tabular-nums">
              {competition.participants}
            </span>
          </div>
        )}

        <div className="h-px bg-ns-border" />

        {ctaLabel ? (
          <>
            <Button
              onClick={onCta}
              disabled={ctaDisabled}
              className="w-full bg-ns-ink text-ns-bg hover:opacity-90 rounded-[10px] py-[15px]"
            >
              {ctaLabel}
            </Button>
            <p className="font-body italic text-[13px] text-ns-ink-muted text-center">
              Entering is free — nothing is deducted from your balance.
            </p>
          </>
        ) : (
          <p className="font-body text-[13px] text-ns-ink-secondary text-center">
            {signedOut
              ? "Sign in to enter this competition."
              : isCreator
                ? "You organised this competition, so you can't enter it yourself."
                : phaseBlurb}
          </p>
        )}
      </div>
    </div>
  );
}

export default CompetitionEntryCard;
