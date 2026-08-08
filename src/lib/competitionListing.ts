import type { ICompetition } from "@/types/ICompetition";
import { formatMinorUnits } from "@/lib/money";

/** Prize display, honoring the legacy-pool rule: pre-TALE competitions show their label, not a fabricated TALE amount. */
export function getPrizeDisplay(competition: ICompetition): {
  amount: string;
  symbol: string;
} {
  if (competition.prizePool) {
    return {
      amount: formatMinorUnits(
        competition.prizePool.amount,
        competition.prizePool.decimals,
      ),
      symbol: competition.prizePool.symbol,
    };
  }
  return { amount: competition.legacyPrizeLabel ?? "—", symbol: "" };
}

export function getHostName(competition: ICompetition): string {
  return competition.organizer || competition.creatorName || "Unknown host";
}

/**
 * Whether the viewer has joined but has no visible next step surfaced by the
 * list query — the closest available analog to the design's "has a draft"
 * state, since this backend has no separate draft/compose step: joining and
 * submitting are both instant actions, not a saved-in-progress entry.
 */
export function hasJoinedWithoutSubmitting(competition: ICompetition): boolean {
  return Boolean(competition.isJoined) && competition.status === "active";
}

export function isCompetitionFull(competition: ICompetition): boolean {
  return (
    !!competition.maxParticipants &&
    competition.participants >= competition.maxParticipants
  );
}
