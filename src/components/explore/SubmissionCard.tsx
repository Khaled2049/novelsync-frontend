import { Link } from "react-router-dom";
import type { ICompetitionSubmission } from "@/types/ICompetitionSubmission";

interface SubmissionCardProps {
  submission: ICompetitionSubmission;
  /** Voting controls are hidden outside the voting phase. */
  canVote: boolean;
  selected: boolean;
  onToggleVote: (submissionId: string) => void;
  disabled?: boolean;
  isOwnEntry?: boolean;
  /** Rank is only ever known after settlement. */
  rank?: number;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  canVote,
  selected,
  onToggleVote,
  disabled = false,
  isOwnEntry = false,
  rank,
}) => {
  return (
    <article className="group border-b border-neutral-200 dark:border-neutral-800 py-6 flex items-start gap-5">
      {submission.coverImageUrl ? (
        <img
          src={submission.coverImageUrl}
          alt=""
          className="w-16 h-24 object-cover shrink-0 bg-neutral-100 dark:bg-neutral-900"
        />
      ) : (
        <div className="w-16 h-24 shrink-0 bg-neutral-100 dark:bg-neutral-900" />
      )}

      <div className="flex-1 min-w-0">
        {rank !== undefined && (
          <p className="font-ui text-[10px] font-bold tracking-[0.18em] uppercase text-dark-green dark:text-light-green mb-1">
            {rank === 1 ? "Winner" : `Rank ${rank}`}
          </p>
        )}

        <h3 className="font-heading text-xl md:text-2xl font-light italic text-neutral-900 dark:text-neutral-50 leading-tight">
          <Link
            to={`/story/${submission.storyId}`}
            className="hover:text-dark-green dark:hover:text-light-green transition-colors"
          >
            {submission.storyTitle}
          </Link>
        </h3>

        <p className="font-ui text-[10px] tracking-[0.14em] uppercase text-neutral-400 dark:text-neutral-600 mt-1">
          {submission.storyAuthorName ?? "Anonymous"}
          {isOwnEntry && " · your entry"}
        </p>

        {/* A vote count exists only after settlement — during voting there is
            no readable tally anywhere, by design. */}
        {submission.voteCount !== undefined && (
          <p className="font-ui text-[11px] font-semibold tracking-wide text-neutral-500 dark:text-neutral-400 mt-2 tabular-nums">
            {submission.voteCount} vote{submission.voteCount === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2">
        <Link
          to={`/story/${submission.storyId}`}
          className="font-ui text-[10px] font-semibold tracking-[0.12em] uppercase text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Read
        </Link>

        {canVote && (
          <button
            type="button"
            onClick={() => onToggleVote(submission.id)}
            disabled={disabled || isOwnEntry}
            title={
              isOwnEntry ? "You can't vote for your own entry" : undefined
            }
            className={`font-ui text-[10px] font-bold tracking-[0.12em] uppercase px-3 py-1.5 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              selected
                ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white"
                : "text-neutral-900 dark:text-white border-neutral-900 dark:border-white hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900"
            }`}
          >
            {selected ? "Backed" : "Back this"}
          </button>
        )}
      </div>
    </article>
  );
};

export default SubmissionCard;
