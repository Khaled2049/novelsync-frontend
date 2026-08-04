/**
 * Entering and voting.
 *
 * Two invariants drive the shape of everything here:
 *
 * 1. **One entry and one ballot per person, enforced structurally.** Both
 *    `submissions/{uid}` and `votes/{voterUid}` are keyed by the acting user's
 *    id, so a duplicate is impossible by construction rather than by a query
 *    that could race.
 *
 * 2. **Live standings are never readable.** Running counts live only in
 *    `competitions/{id}/private/tally`, which `firestore.rules` denies to every
 *    client. Submissions carry no `voteCount` until settlement writes one. That
 *    makes "results hidden until settled" a rules guarantee rather than an
 *    absence of UI, and it means a voter cannot pile onto a leader.
 */
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { corsOptions } from "./corsConfig";
import { requireAdmin, requireAuth } from "./authService";
import { CompetitionPhase, canTransition } from "./competitionPhase";
import { ensurePhase, loadCompetitionWithPhase } from "./competitionLifecycle";

const db = admin.firestore();

/** Ceiling on submissions read in one pass; also the practical entry cap. */
export const MAX_SUBMISSIONS_PER_COMPETITION = 500;

/** How many entries one voter may back. Stored per competition later. */
const DEFAULT_MAX_VOTES_PER_USER = 3;

const fail = (message: string, statusCode: number): Error =>
  Object.assign(new Error(message), { statusCode });

const toStatus = (error: unknown, fallback: number): number =>
  Number((error as { statusCode?: number })?.statusCode) || fallback;

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/**
 * Enter a story into a competition.
 *
 * The story must be published: `firestore.rules` only exposes a story when
 * `isPublished == true`, so entering an unpublished one would put something in
 * the gallery that no voter could actually read.
 *
 * Display fields are denormalized at submit time so the gallery costs no extra
 * reads, and so it survives the author later unpublishing or deleting the story.
 */
export const submitToCompetition = onRequest(
  corsOptions,
  requireAuth(async (request, response, userId) => {
    try {
      if (request.method !== "POST") {
        response.status(405).json({ error: "Method not allowed" });
        return;
      }

      const { competitionId, storyId } = request.body ?? {};
      if (!competitionId || typeof competitionId !== "string") {
        response.status(400).json({ error: "competitionId is required" });
        return;
      }
      if (!storyId || typeof storyId !== "string") {
        response.status(400).json({ error: "storyId is required" });
        return;
      }

      const { ref: competitionRef, data: competition, phase } =
        await loadCompetitionWithPhase(db, competitionId);

      if (phase !== "open") {
        throw fail(
          phase === "draft"
            ? "This competition has not opened yet"
            : "Submissions for this competition have closed",
          422,
        );
      }

      if (competition.creatorId === userId) {
        // The creator funds the pool; letting them enter it is self-dealing.
        throw fail("You can't enter a competition you created", 422);
      }

      const storySnapshot = await db.collection("stories").doc(storyId).get();
      if (!storySnapshot.exists) {
        throw fail("Story not found", 404);
      }

      const story = storySnapshot.data() ?? {};
      if (story.userId !== userId) {
        throw fail("You can only submit your own stories", 403);
      }
      if (story.isPublished !== true) {
        throw fail(
          "Publish your story before entering it — voters need to be able to read it",
          422,
        );
      }

      const submissionRef = competitionRef
        .collection("submissions")
        .doc(userId);
      const participantRef = competitionRef
        .collection("participants")
        .doc(userId);

      await db.runTransaction(async (tx) => {
        const [submissionSnapshot, participantSnapshot, competitionSnapshot] =
          await Promise.all([
            tx.get(submissionRef),
            tx.get(participantRef),
            tx.get(competitionRef),
          ]);

        if (submissionSnapshot.exists) {
          const existing = submissionSnapshot.data() ?? {};
          if (existing.status === "submitted") {
            throw fail("You have already entered this competition", 409);
          }
        }

        if (!participantSnapshot.exists) {
          throw fail("Join this competition before entering a story", 403);
        }

        const current = competitionSnapshot.data() ?? {};
        const submissionCount =
          typeof current.submissionCount === "number"
            ? current.submissionCount
            : 0;

        // Only count a genuinely new entry — re-submitting after a withdrawal
        // must not inflate the total.
        const isNew =
          !submissionSnapshot.exists ||
          submissionSnapshot.data()?.status !== "submitted";

        if (isNew && submissionCount >= MAX_SUBMISSIONS_PER_COMPETITION) {
          throw fail("This competition has reached its entry limit", 409);
        }

        const timestamp = FieldValue.serverTimestamp();

        tx.set(
          submissionRef,
          {
            userId,
            storyId,
            // Denormalized so the gallery needs no story reads and does not
            // break if the story is later unpublished or removed.
            storyTitle: story.title ?? "Untitled story",
            storyAuthorName: story.authorName ?? story.username ?? null,
            coverImageUrl: story.coverImageUrl ?? null,
            status: "submitted",
            submittedAt: submissionSnapshot.exists
              ? (submissionSnapshot.data()?.submittedAt ?? timestamp)
              : timestamp,
            updatedAt: timestamp,
          },
          { merge: true },
        );

        if (isNew) {
          tx.update(competitionRef, {
            submissionCount: FieldValue.increment(1),
            updatedAt: timestamp,
          });
        }
      });

      response.status(200).json({
        submissionId: userId,
        competitionId,
        storyId,
        status: "submitted",
      });
    } catch (error) {
      logger.error("Error submitting to competition", { userId, error });
      response
        .status(toStatus(error, 500))
        .json({ error: errorMessage(error, "Failed to submit entry") });
    }
  }),
);

/** Withdraw an entry while submissions are still open. */
export const withdrawSubmission = onRequest(
  corsOptions,
  requireAuth(async (request, response, userId) => {
    try {
      if (request.method !== "POST") {
        response.status(405).json({ error: "Method not allowed" });
        return;
      }

      const { competitionId } = request.body ?? {};
      if (!competitionId || typeof competitionId !== "string") {
        response.status(400).json({ error: "competitionId is required" });
        return;
      }

      const { ref: competitionRef, phase } = await loadCompetitionWithPhase(
        db,
        competitionId,
      );

      if (phase !== "open") {
        // Once voting starts, people have read and voted on this entry.
        throw fail("Entries can no longer be withdrawn", 422);
      }

      const submissionRef = competitionRef
        .collection("submissions")
        .doc(userId);

      await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(submissionRef);
        if (!snapshot.exists || snapshot.data()?.status !== "submitted") {
          throw fail("You have no entry to withdraw", 404);
        }

        const timestamp = FieldValue.serverTimestamp();
        tx.update(submissionRef, { status: "withdrawn", updatedAt: timestamp });
        tx.update(competitionRef, {
          submissionCount: FieldValue.increment(-1),
          updatedAt: timestamp,
        });
      });

      response
        .status(200)
        .json({ submissionId: userId, competitionId, status: "withdrawn" });
    } catch (error) {
      logger.error("Error withdrawing submission", { userId, error });
      response
        .status(toStatus(error, 500))
        .json({ error: errorMessage(error, "Failed to withdraw entry") });
    }
  }),
);

/**
 * Cast or replace a ballot.
 *
 * A ballot is the complete set of entries a voter backs, not a single vote, so
 * changing your mind is one write that replaces the previous set. Tally deltas
 * are computed against the prior ballot inside the transaction, which is why
 * explicit counts are written rather than blind increments.
 */
export const castCompetitionVote = onRequest(
  corsOptions,
  requireAuth(async (request, response, userId) => {
    try {
      if (request.method !== "POST") {
        response.status(405).json({ error: "Method not allowed" });
        return;
      }

      const { competitionId, submissionIds } = request.body ?? {};
      if (!competitionId || typeof competitionId !== "string") {
        response.status(400).json({ error: "competitionId is required" });
        return;
      }
      if (!Array.isArray(submissionIds)) {
        response.status(400).json({ error: "submissionIds must be a list" });
        return;
      }

      const chosen = Array.from(
        new Set(
          submissionIds.filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          ),
        ),
      );

      const { ref: competitionRef, data: competition, phase } =
        await loadCompetitionWithPhase(db, competitionId);

      if (phase !== "voting") {
        throw fail(
          phase === "open"
            ? "Voting has not opened yet"
            : "Voting for this competition has closed",
          422,
        );
      }

      const maxVotes =
        typeof competition.votingRules?.maxVotesPerUser === "number"
          ? competition.votingRules.maxVotesPerUser
          : DEFAULT_MAX_VOTES_PER_USER;

      if (chosen.length > maxVotes) {
        throw fail(`You can back at most ${maxVotes} entries`, 400);
      }

      if (chosen.includes(userId)) {
        throw fail("You can't vote for your own entry", 422);
      }

      // Eligibility: must have written something. Uses the storyCount counter
      // already maintained by storyCountTrigger, so it costs one read and
      // meaningfully raises the cost of running sockpuppets.
      const voterSnapshot = await db.collection("users").doc(userId).get();
      const storyCount = voterSnapshot.data()?.storyCount;
      if (typeof storyCount !== "number" || storyCount < 1) {
        throw fail(
          "Publish a story before voting — voting is open to writers",
          403,
        );
      }

      const ballotRef = competitionRef.collection("votes").doc(userId);
      const tallyRef = competitionRef.collection("private").doc("tally");

      await db.runTransaction(async (tx) => {
        const reads = await Promise.all([
          tx.get(ballotRef),
          tx.get(tallyRef),
          ...chosen.map((id) =>
            tx.get(competitionRef.collection("submissions").doc(id)),
          ),
        ]);

        const ballotSnapshot = reads[0];
        const tallySnapshot = reads[1];
        const submissionSnapshots = reads.slice(2);

        submissionSnapshots.forEach((snapshot, index) => {
          if (!snapshot.exists || snapshot.data()?.status !== "submitted") {
            throw fail(`Entry ${chosen[index]} is not in this competition`, 400);
          }
        });

        const previous: string[] = Array.isArray(ballotSnapshot.data()?.submissionIds)
          ? ballotSnapshot.data()!.submissionIds
          : [];

        const counts: Record<string, number> = {
          ...(tallySnapshot.data()?.counts ?? {}),
        };

        for (const id of previous) {
          counts[id] = Math.max(0, (counts[id] ?? 0) - 1);
        }
        for (const id of chosen) {
          counts[id] = (counts[id] ?? 0) + 1;
        }

        const timestamp = FieldValue.serverTimestamp();
        const isFirstBallot = !ballotSnapshot.exists;

        tx.set(
          ballotRef,
          {
            voterId: userId,
            submissionIds: chosen,
            castAt: isFirstBallot ? timestamp : ballotSnapshot.data()?.castAt,
            updatedAt: timestamp,
          },
          { merge: true },
        );

        tx.set(
          tallyRef,
          { counts, updatedAt: timestamp },
          { merge: true },
        );

        if (isFirstBallot) {
          // Total ballots cast is safe to publish — it reveals participation,
          // never who is ahead.
          tx.update(competitionRef, {
            ballotCount: FieldValue.increment(1),
            updatedAt: timestamp,
          });
        }
      });

      response.status(200).json({ competitionId, votedFor: chosen });
    } catch (error) {
      logger.error("Error casting vote", { userId, error });
      response
        .status(toStatus(error, 500))
        .json({ error: errorMessage(error, "Failed to record your vote") });
    }
  }),
);

/**
 * Manually move a competition to a phase. Admin only.
 *
 * This is not test-only scaffolding: it is the override you want when a
 * deadline was wrong or a task never fired. It is also what lets an end-to-end
 * test exercise the real lifecycle without waiting days for a deadline.
 */
export const advanceCompetitionPhase = onRequest(
  corsOptions,
  requireAdmin(async (request, response, adminUserId) => {
    try {
      if (request.method !== "POST") {
        response.status(405).json({ error: "Method not allowed" });
        return;
      }

      const { competitionId, targetPhase } = request.body ?? {};
      if (!competitionId || typeof competitionId !== "string") {
        response.status(400).json({ error: "competitionId is required" });
        return;
      }

      const competitionRef = db.collection("competitions").doc(competitionId);
      const snapshot = await competitionRef.get();
      if (!snapshot.exists) {
        response.status(404).json({ error: "Competition not found" });
        return;
      }

      // With no target, just run the normal clock-driven evaluation.
      if (!targetPhase) {
        const { phase } = await ensurePhase(db, competitionId);
        response.status(200).json({ competitionId, phase });
        return;
      }

      const current: CompetitionPhase =
        (snapshot.data()?.phase as CompetitionPhase) ?? "open";
      const target = targetPhase as CompetitionPhase;

      if (!canTransition(current, target)) {
        response.status(409).json({
          error: `Cannot move a competition from ${current} to ${target}`,
        });
        return;
      }

      if (target === "settled" || target === "settling") {
        // Settling ranks entries and pays them. Only settleCompetition may
        // claim it, so that the payout and the recorded result cannot diverge.
        response.status(409).json({
          error: "Use settleCompetition to settle a competition",
        });
        return;
      }

      await competitionRef.update({
        phase: target,
        phaseUpdatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info("Competition phase advanced manually", {
        competitionId,
        from: current,
        to: target,
        adminUserId,
      });

      response.status(200).json({ competitionId, phase: target });
    } catch (error) {
      logger.error("Error advancing competition phase", {
        adminUserId,
        error,
      });
      response
        .status(toStatus(error, 500))
        .json({ error: errorMessage(error, "Failed to advance phase") });
    }
  }),
);
