import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  useCastVote,
  useCompetitionQuery,
  useJoinCompetition,
  useMyBallotQuery,
  useSubmissionsQuery,
  useSubmitStory,
  useWithdrawSubmission,
} from "@/hooks/queries/useCompetitionQueries";
import SubmissionCard from "./SubmissionCard";
import SubmissionPicker from "./SubmissionPicker";
import { formatMinorUnits } from "@/lib/money";
import type { CompetitionPhase } from "@/types/ICompetition";
import type { ICompetitionSubmission } from "@/types/ICompetitionSubmission";

const MAX_VOTES_PER_USER = 3;

const PHASE_COPY: Record<CompetitionPhase, { label: string; blurb: string }> = {
  draft: {
    label: "Not open yet",
    blurb: "Entries open when the competition starts.",
  },
  open: {
    label: "Open for entries",
    blurb: "Join, then enter one of your published stories.",
  },
  voting: {
    label: "Voting open",
    blurb:
      "Back up to three entries. Results stay hidden until voting closes — nobody can see who's ahead.",
  },
  settling: {
    label: "Counting votes",
    blurb: "Voting has closed and the prize is being paid out.",
  },
  settled: { label: "Settled", blurb: "The prize has been paid out." },
  cancelled: {
    label: "Cancelled",
    blurb: "This competition was cancelled and its prize refunded.",
  },
};

/**
 * Stable per-viewer ordering.
 *
 * Entries are shuffled by a hash of (competition, viewer, submission) so
 * position never implies standing and every viewer sees a different order —
 * which blunts the first-position bias a fixed list would create. It is
 * deterministic, so the order does not jump around as the viewer votes.
 */
const shuffleForViewer = (
  submissions: ICompetitionSubmission[],
  seed: string,
): ICompetitionSubmission[] => {
  const score = (id: string): number => {
    let hash = 2166136261;
    const input = `${seed}:${id}`;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  return [...submissions].sort((a, b) => score(a.id) - score(b.id));
};

const CompetitionDetail: React.FC = () => {
  const { competitionId = "" } = useParams<{ competitionId: string }>();
  const { user } = useAuthContext();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: competition, isLoading } = useCompetitionQuery(
    competitionId,
    user?.uid,
  );
  const { data: submissions } = useSubmissionsQuery(competitionId);
  const { data: ballot } = useMyBallotQuery(competitionId, user?.uid);

  const joinCompetition = useJoinCompetition(user?.uid);
  const submitStory = useSubmitStory(competitionId);
  const withdrawSubmission = useWithdrawSubmission(competitionId);
  const castVote = useCastVote(competitionId, user?.uid);

  const phase: CompetitionPhase = competition?.phase ?? "open";
  const entries = useMemo(() => submissions ?? [], [submissions]);

  const myEntry = entries.find((entry) => entry.userId === user?.uid);
  const selected = ballot?.submissionIds ?? [];

  /** Rank 1 with a non-zero payout, if anyone actually won. */
  const winner = useMemo(
    () => competition?.results?.find((r) => r.rank === 1 && BigInt(r.amount) > 0n),
    [competition?.results],
  );
  const winnerEntry = entries.find((e) => e.id === winner?.submissionId);

  const ordered = useMemo(() => {
    if (phase === "settled" && competition?.results?.length) {
      // Once settled, the server's ranking IS the result — mirror it exactly
      // rather than re-deriving an order from denormalized vote counts.
      const rankOf = new Map(
        competition.results.map((result) => [result.submissionId, result.rank]),
      );
      return [...entries].sort(
        (a, b) =>
          (rankOf.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
          (rankOf.get(b.id) ?? Number.MAX_SAFE_INTEGER),
      );
    }
    return shuffleForViewer(entries, `${competitionId}:${user?.uid ?? "anon"}`);
  }, [entries, phase, competitionId, user?.uid, competition?.results]);

  const handleToggleVote = (submissionId: string) => {
    if (!user) {
      toast.error("Sign in to vote");
      return;
    }

    const next = selected.includes(submissionId)
      ? selected.filter((id) => id !== submissionId)
      : [...selected, submissionId];

    if (next.length > MAX_VOTES_PER_USER) {
      toast.error(`You can back at most ${MAX_VOTES_PER_USER} entries`);
      return;
    }

    castVote.mutate(next, {
      onError: (error) =>
        toast.error(
          error instanceof Error ? error.message : "Failed to record your vote",
        ),
    });
  };

  /**
   * Entering implies joining. The server requires participation before an
   * entry, so join first when needed rather than making the reader do it as a
   * separate step and leaving the entry action inert until they do.
   */
  const handlePickStory = async (storyId: string) => {
    try {
      if (!competition?.isJoined) {
        await joinCompetition.mutateAsync(competitionId);
      }
      await submitStory.mutateAsync(storyId);
      toast.success("Your entry is in");
      setPickerOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit your entry",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-5 md:px-12 py-20 text-center">
        <p className="font-body text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="max-w-4xl mx-auto px-5 md:px-12 py-20 text-center">
        <p className="font-heading italic text-3xl text-neutral-300 dark:text-neutral-700">
          Competition not found.
        </p>
      </div>
    );
  }

  const copy = PHASE_COPY[phase];
  const isCreator = competition.creatorId === user?.uid;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-5 md:px-12 py-12 md:py-16">
        <Link
          to="/explore/competitions"
          className="inline-flex items-center gap-2 font-ui text-[10px] font-semibold tracking-[0.14em] uppercase text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-3 h-3" />
          All competitions
        </Link>

        <header className="mb-10">
          <p className="font-ui text-[10px] font-bold tracking-[0.18em] uppercase text-dark-green dark:text-light-green mb-3">
            {copy.label}
          </p>
          <h1 className="font-heading text-[2.5rem] md:text-[3.5rem] font-light italic leading-[1.05] text-neutral-900 dark:text-white mb-4">
            {competition.title}
          </h1>
          <p className="font-body text-base text-neutral-600 dark:text-neutral-400 max-w-2xl">
            {competition.description}
          </p>

          <div className="flex items-baseline gap-8 mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <div>
              <p className="font-ui text-[9px] font-bold tracking-[0.16em] uppercase text-neutral-400 dark:text-neutral-600 mb-1">
                {competition.prizePool ? competition.prizePool.symbol : "Prize"}
              </p>
              <p className="font-heading text-3xl font-light italic text-neutral-900 dark:text-white leading-none">
                {competition.prizePool
                  ? formatMinorUnits(
                      competition.prizePool.amount,
                      competition.prizePool.decimals,
                    )
                  : (competition.legacyPrizeLabel ?? "—")}
              </p>
            </div>
            <div>
              <p className="font-ui text-[9px] font-bold tracking-[0.16em] uppercase text-neutral-400 dark:text-neutral-600 mb-1">
                Entries
              </p>
              <p className="font-heading text-3xl font-light italic text-neutral-900 dark:text-white leading-none tabular-nums">
                {entries.length}
              </p>
            </div>
            {/* Ballots cast is participation, not standings — it reveals
                nothing about who is winning. */}
            {phase === "voting" && (
              <div>
                <p className="font-ui text-[9px] font-bold tracking-[0.16em] uppercase text-neutral-400 dark:text-neutral-600 mb-1">
                  Ballots cast
                </p>
                <p className="font-heading text-3xl font-light italic text-neutral-900 dark:text-white leading-none tabular-nums">
                  {competition.ballotCount ?? 0}
                </p>
              </div>
            )}
          </div>

          <p className="font-body text-sm text-neutral-500 dark:text-neutral-400 mt-5">
            {copy.blurb}
          </p>
        </header>

        {/* Entrant actions */}
        {user && phase === "open" && !isCreator && (
          <div className="mb-10 flex items-center gap-3 flex-wrap">
            {!competition.isJoined && (
              <button
                type="button"
                onClick={() => joinCompetition.mutate(competitionId)}
                disabled={joinCompetition.isPending}
                className="font-ui text-[11px] font-bold tracking-[0.12em] uppercase text-neutral-900 dark:text-white border border-neutral-900 dark:border-white px-4 py-2 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-colors disabled:opacity-50"
              >
                {joinCompetition.isPending ? "Joining…" : "Join"}
              </button>
            )}

            {myEntry ? (
              <>
                <span className="font-ui text-[11px] tracking-[0.1em] uppercase text-neutral-500">
                  Entered: {myEntry.storyTitle}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    withdrawSubmission.mutate(undefined, {
                      onSuccess: () => toast.success("Entry withdrawn"),
                      onError: (error) =>
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Failed to withdraw",
                        ),
                    })
                  }
                  disabled={withdrawSubmission.isPending}
                  className="font-ui text-[10px] font-semibold tracking-[0.12em] uppercase text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  Withdraw
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="font-ui text-[11px] font-bold tracking-[0.12em] uppercase text-neutral-900 dark:text-white border border-neutral-900 dark:border-white px-4 py-2 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-colors"
              >
                Enter a story
              </button>
            )}
          </div>
        )}

        {/* The creator funds the pool, so letting them enter it would be
            self-dealing — say so rather than showing nothing. */}
        {user && phase === "open" && isCreator && (
          <p className="font-body text-sm text-neutral-500 dark:text-neutral-400 mb-10">
            You organised this competition, so you can't enter it yourself.
          </p>
        )}

        {!user && phase === "open" && (
          <p className="font-body text-sm text-neutral-500 dark:text-neutral-400 mb-10">
            Sign in to enter one of your published stories.
          </p>
        )}

        {phase === "voting" && user && (
          <p className="font-ui text-[11px] tracking-[0.1em] uppercase text-neutral-500 dark:text-neutral-400 mb-6">
            You've backed {selected.length} of {MAX_VOTES_PER_USER}
          </p>
        )}

        {/* Results. `results` is written once, at settlement — it is the record
            of what was actually paid, and the digest lets anyone verify it
            against the stored payload. */}
        {phase === "settled" && competition.results && (
          <section className="mb-10 border border-neutral-200 dark:border-neutral-800 p-5 md:p-6">
            <h2 className="font-heading italic text-2xl font-light text-neutral-900 dark:text-white mb-4">
              {winner ? "Results" : "No prize awarded"}
            </h2>

            {winner ? (
              <p className="font-body text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                <strong className="font-semibold text-neutral-900 dark:text-white">
                  {winnerEntry?.storyTitle ?? winner.submissionId}
                </strong>{" "}
                won with {winner.votes} vote{winner.votes === 1 ? "" : "s"},
                taking{" "}
                {competition.prizePool
                  ? `${formatMinorUnits(winner.amount, competition.prizePool.decimals)} ${competition.prizePool.symbol}`
                  : formatMinorUnits(winner.amount)}
                .
              </p>
            ) : (
              <p className="font-body text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                No entry received a vote, so the prize pool was returned to the
                organiser.
              </p>
            )}

            {competition.resultsDigest && (
              <p
                className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600 break-all"
                title="SHA-256 of the published results payload"
              >
                digest {competition.resultsDigest}
              </p>
            )}
          </section>
        )}

        <div className="border-t border-neutral-900 dark:border-neutral-100 pt-2">
          {ordered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-heading italic text-2xl text-neutral-300 dark:text-neutral-700">
                No entries yet.
              </p>
            </div>
          ) : (
            ordered.map((submission, index) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                canVote={phase === "voting" && !!user}
                selected={selected.includes(submission.id)}
                onToggleVote={handleToggleVote}
                disabled={castVote.isPending}
                isOwnEntry={submission.userId === user?.uid}
                rank={phase === "settled" ? index + 1 : undefined}
              />
            ))
          )}
        </div>
      </div>

      {user && (
        <SubmissionPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          userId={user.uid}
          onPick={handlePickStory}
          isSubmitting={submitStory.isPending || joinCompetition.isPending}
        />
      )}
    </div>
  );
};

export default CompetitionDetail;
