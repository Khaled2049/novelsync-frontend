import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { corsOptions } from "./corsConfig";
import { requireAuth } from "./authService";

const db = admin.firestore();

interface CompetitionDoc {
  startDate?: admin.firestore.Timestamp;
  deadline?: admin.firestore.Timestamp;
  maxParticipants?: number | null;
  participantsCount?: number;
}

export const joinCompetition = onRequest(
  corsOptions,
  requireAuth(async (request, response, userId) => {
    try {
      if (request.method !== "POST") {
        response.status(405).json({ error: "Method not allowed" });
        return;
      }

      const competitionId = request.body?.competitionId;
      if (!competitionId || typeof competitionId !== "string") {
        response.status(400).json({ error: "competitionId is required" });
        return;
      }

      const competitionRef = db.collection("competitions").doc(competitionId);
      const participantRef = competitionRef.collection("participants").doc(userId);
      const userJoinRef = db
        .collection("users")
        .doc(userId)
        .collection("competitionJoins")
        .doc(competitionId);

      const joinedAt = await db.runTransaction(async (transaction) => {
        const [competitionSnapshot, participantSnapshot] = await Promise.all([
          transaction.get(competitionRef),
          transaction.get(participantRef),
        ]);

        if (!competitionSnapshot.exists) {
          const error = new Error("Competition not found");
          (error as any).statusCode = 404;
          throw error;
        }

        if (participantSnapshot.exists) {
          const error = new Error("You have already joined this competition");
          (error as any).statusCode = 409;
          throw error;
        }

        const data = competitionSnapshot.data() as CompetitionDoc;
        const startDate = data.startDate?.toDate?.();
        const deadline = data.deadline?.toDate?.();

        if (!startDate || !deadline) {
          const error = new Error("Competition has invalid dates");
          (error as any).statusCode = 422;
          throw error;
        }

        const now = Date.now();
        if (now > deadline.getTime()) {
          const error = new Error("Competition is closed");
          (error as any).statusCode = 422;
          throw error;
        }

        const participantsCount =
          typeof data.participantsCount === "number" ? data.participantsCount : 0;
        const maxParticipants =
          typeof data.maxParticipants === "number" ? data.maxParticipants : null;

        if (maxParticipants !== null && participantsCount >= maxParticipants) {
          const error = new Error("Competition is full");
          (error as any).statusCode = 409;
          throw error;
        }

        const timestamp = FieldValue.serverTimestamp();

        transaction.set(participantRef, {
          userId,
          joinedAt: timestamp,
        });

        transaction.set(
          userJoinRef,
          {
            competitionId,
            joinedAt: timestamp,
          },
          { merge: true }
        );

        transaction.update(competitionRef, {
          participantsCount: FieldValue.increment(1),
          updatedAt: timestamp,
        });

        return new Date().toISOString();
      });

      response.status(200).json({ success: true, joinedAt });
    } catch (error) {
      logger.error("Error joining competition", error);
      const statusCode = Number((error as any)?.statusCode) || 500;
      response.status(statusCode).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to join competition",
      });
    }
  })
);
