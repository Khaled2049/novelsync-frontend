import { Link } from "react-router-dom";
import { getHostName } from "@/lib/competitionListing";
import type { ICompetition } from "@/types/ICompetition";

export interface CompetitionHostCardProps {
  competition: ICompetition;
}

/**
 * No host trust/track-record aggregation exists anywhere in the backend, so
 * this deliberately doesn't show a fabricated "N competitions hosted" line —
 * just the name and a link into the same host-name search the index page
 * already supports.
 */
export function CompetitionHostCard({ competition }: CompetitionHostCardProps) {
  const host = getHostName(competition);

  return (
    <div className="rounded-[14px] border border-ns-border bg-ns-surface p-[22px] flex items-center gap-3">
      <div className="w-10 h-10 rounded-ns bg-ns-elevated border border-ns-border flex items-center justify-center font-heading text-lg text-ns-ink shrink-0">
        {host.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading text-lg text-ns-ink truncate">{host}</p>
        <Link
          to={`/explore/competitions?q=${encodeURIComponent(host)}`}
          className="font-ui text-xs font-semibold text-ns-accent hover:text-ns-accent-hover"
        >
          View their competitions
        </Link>
      </div>
    </div>
  );
}

export default CompetitionHostCard;
