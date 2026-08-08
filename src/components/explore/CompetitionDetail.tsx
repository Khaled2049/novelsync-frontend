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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useNow } from "@/hooks/useCountdown";
import { useHashTab } from "@/hooks/useHashTab";
import { isCompetitionFull } from "@/lib/competitionListing";
import CompetitionDetailHero from "./CompetitionDetailHero";
import CompetitionBrief from "./CompetitionBrief";
import CompetitionEntryCard from "./CompetitionEntryCard";
import CompetitionEnteredCard from "./CompetitionEnteredCard";
import CompetitionKeyDatesCard from "./CompetitionKeyDatesCard";
import CompetitionHostCard from "./CompetitionHostCard";
import CompetitionResultsCard from "./CompetitionResultsCard";
import SubmissionCard from "./SubmissionCard";
import SubmissionPicker from "./SubmissionPicker";
import type { CompetitionPhase } from "@/types/ICompetition";
import type { ICompetitionSubmission } from "@/types/ICompetitionSubmission";

const MAX_VOTES_PER_USER = 3;
const TABS = ["brief", "entrants"] as const;

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
  const now = useNow();
  const [tab, setTab] = useHashTab(TABS, "brief");

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

  /** No server-side edit-in-place — withdraw, then let the picker reopen. */
  const handleEditEntry = async () => {
    try {
      await withdrawSubmission.mutateAsync();
      setPickerOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to withdraw your entry",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <p className="font-body text-sm text-ns-ink-muted">Loading…</p>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="py-20 text-center">
        <p className="font-heading text-3xl text-ns-ink-muted">
          Competition not found.
        </p>
      </div>
    );
  }

  const copy = PHASE_COPY[phase];
  const isCreator = competition.creatorId === user?.uid;
  const full = isCompetitionFull(competition);

  // Shared between the hero and the sticky rail's entry card. `null` means
  // "no actionable button" — each card falls back to phase/sign-in/creator copy.
  let cta: { label: string; onClick?: () => void; disabled?: boolean } | null = null;
  if (!myEntry && user && !isCreator && phase === "open") {
    cta = full
      ? { label: "Competition is full", disabled: true }
      : {
          label: competition.isJoined ? "Continue your entry" : "Enter this competition",
          onClick: () => setPickerOpen(true),
        };
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center py-[22px] border-b border-ns-border">
        <Link
          to="/explore/competitions"
          className="inline-flex items-center gap-2 font-ui text-[13px] font-semibold text-ns-ink-secondary hover:text-ns-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All competitions
        </Link>
      </div>

      <CompetitionDetailHero
        competition={competition}
        now={now}
        phaseLabel={copy.label}
        phaseBlurb={copy.blurb}
        hasEntered={!!myEntry}
        signedOut={!user}
        isCreator={isCreator}
        ctaLabel={cta?.label}
        onCta={cta?.onClick}
        ctaDisabled={cta?.disabled}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="border-b border-ns-border">
          <TabsList className="h-auto bg-transparent p-0 gap-9 rounded-none">
            <TabsTrigger
              value="brief"
              className="rounded-none bg-transparent px-1 py-4 font-ui text-sm text-ns-ink-muted transition-colors hover:text-ns-ink-secondary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-ns-ink data-[state=active]:shadow-[inset_0_-2px_0_0_var(--ns-accent)]"
            >
              The brief
            </TabsTrigger>
            <TabsTrigger
              value="entrants"
              className="gap-2 rounded-none bg-transparent px-1 py-4 font-ui text-sm text-ns-ink-muted transition-colors hover:text-ns-ink-secondary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-ns-ink data-[state=active]:shadow-[inset_0_-2px_0_0_var(--ns-accent)]"
            >
              Entrants
              <Badge variant="default" className="px-[7px] py-0.5 text-[11px] leading-none">
                {entries.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_348px] gap-12 items-start mt-8">
          <div>
            {phase === "settled" && competition.results && (
              <CompetitionResultsCard
                competition={competition}
                entries={entries}
                currentUserId={user?.uid}
              />
            )}

            <TabsContent value="brief" className="mt-0">
              <CompetitionBrief competition={competition} />
            </TabsContent>

            <TabsContent value="entrants" className="mt-0">
              {phase === "voting" && user && (
                <p className="font-ui text-[11px] tracking-[0.1em] uppercase text-ns-ink-secondary mb-6">
                  You've backed {selected.length} of {MAX_VOTES_PER_USER} ·{" "}
                  {competition.ballotCount ?? 0} ballots cast so far
                </p>
              )}
              {ordered.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="font-heading text-2xl text-ns-ink-muted">
                    No entries yet.
                  </p>
                </div>
              ) : (
                <div className="border-t border-ns-border">
                  {ordered.map((submission, index) => (
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
                  ))}
                </div>
              )}
            </TabsContent>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            {myEntry ? (
              <CompetitionEnteredCard
                competition={competition}
                entry={myEntry}
                onEdit={handleEditEntry}
                onReadBrief={() => setTab("brief")}
                busy={withdrawSubmission.isPending}
              />
            ) : (
              <CompetitionEntryCard
                competition={competition}
                now={now}
                phaseLabel={copy.label}
                phaseBlurb={copy.blurb}
                signedOut={!user}
                isCreator={isCreator}
                ctaLabel={cta?.label}
                onCta={cta?.onClick}
                ctaDisabled={cta?.disabled}
              />
            )}
            <CompetitionKeyDatesCard competition={competition} />
            <CompetitionHostCard competition={competition} />
          </aside>
        </div>
      </Tabs>

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
