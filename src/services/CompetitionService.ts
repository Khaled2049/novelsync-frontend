import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import api, { ApiError } from "@/api";
import { firestore } from "@/config/firebase";
import {
  CompetitionStatus,
  ICompetition,
  ICompetitionInput,
  ICompetitionUpdate,
} from "@/types/ICompetition";

interface CompetitionDoc {
  title?: string;
  description?: string;
  prizeAmount?: number;
  prizeCurrency?: string;
  startDate?: Timestamp;
  deadline?: Timestamp;
  difficulty?: "beginner" | "intermediate" | "advanced";
  maxParticipants?: number | null;
  participantsCount?: number;
  participants?: number;
  tags?: string[];
  category?: string;
  creatorId?: string;
  creatorName?: string;
  organizer?: string;
  sponsor?: ICompetition["sponsor"];
  rules?: string[];
  evaluationCriteria?: string;
}

const computeStatus = (startDate: Date, deadline: Date): CompetitionStatus => {
  const now = Date.now();

  if (now < startDate.getTime()) return "upcoming";
  if (now > deadline.getTime()) return "completed";
  return "active";
};

const normalizeTags = (tags: string[]): string[] => {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, 32))
    )
  );
};

const sanitizeCompetitionInput = (input: ICompetitionInput) => {
  const title = input.title.trim();
  const description = input.description.trim();
  const category = input.category.trim();
  const prizeCurrency = input.prizeCurrency.trim().toUpperCase();

  if (!title) throw new Error("Title is required");
  if (!description) throw new Error("Description is required");
  if (!category) throw new Error("Category is required");
  if (!prizeCurrency) throw new Error("Prize currency is required");
  if (!Number.isFinite(input.prizeAmount) || input.prizeAmount < 0) {
    throw new Error("Prize amount must be zero or greater");
  }

  if (!(input.startDate instanceof Date) || Number.isNaN(input.startDate.getTime())) {
    throw new Error("Start date is invalid");
  }

  if (!(input.deadline instanceof Date) || Number.isNaN(input.deadline.getTime())) {
    throw new Error("Deadline is invalid");
  }

  if (input.deadline.getTime() <= input.startDate.getTime()) {
    throw new Error("Deadline must be after start date");
  }

  if (
    input.maxParticipants !== undefined &&
    input.maxParticipants !== null &&
    (!Number.isInteger(input.maxParticipants) || input.maxParticipants <= 0)
  ) {
    throw new Error("Max participants must be a whole number greater than 0");
  }

  return {
    title,
    description,
    category,
    prizeCurrency,
    prizeAmount: Number(input.prizeAmount),
    startDate: input.startDate,
    deadline: input.deadline,
    difficulty: input.difficulty,
    maxParticipants:
      input.maxParticipants === undefined ? null : input.maxParticipants,
    tags: normalizeTags(input.tags),
  };
};

class CompetitionService {
  private competitionsCollection = collection(firestore, "competitions");

  private mapCompetition(id: string, data: CompetitionDoc): ICompetition {
    const startDate = data.startDate?.toDate?.() ?? new Date();
    const deadline = data.deadline?.toDate?.() ?? new Date();
    const participantsCount =
      typeof data.participantsCount === "number"
        ? data.participantsCount
        : typeof data.participants === "number"
          ? data.participants
          : 0;

    return {
      id,
      title: data.title ?? "Untitled competition",
      description: data.description ?? "",
      prizeAmount: typeof data.prizeAmount === "number" ? data.prizeAmount : 0,
      prizeCurrency: data.prizeCurrency ?? "USD",
      deadline,
      startDate,
      status: computeStatus(startDate, deadline),
      difficulty: data.difficulty ?? "beginner",
      participants: participantsCount,
      maxParticipants:
        typeof data.maxParticipants === "number" ? data.maxParticipants : undefined,
      tags: Array.isArray(data.tags) ? data.tags : [],
      category: data.category ?? "General",
      organizer: data.organizer ?? data.creatorName ?? "Community",
      creatorId: data.creatorId,
      creatorName: data.creatorName,
      rules: data.rules,
      evaluationCriteria: data.evaluationCriteria,
      sponsor: data.sponsor,
    };
  }

  async getCompetitions(): Promise<ICompetition[]> {
    const competitionsQuery = query(
      this.competitionsCollection,
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(competitionsQuery);
    return snapshot.docs.map((competitionDoc) =>
      this.mapCompetition(competitionDoc.id, competitionDoc.data() as CompetitionDoc)
    );
  }

  async getUserJoinedCompetitionIds(userId: string): Promise<Set<string>> {
    const joinsCollection = collection(
      firestore,
      "users",
      userId,
      "competitionJoins"
    );

    const snapshot = await getDocs(joinsCollection);
    return new Set(snapshot.docs.map((joinDoc) => joinDoc.id));
  }

  async createCompetition(
    userId: string,
    creatorName: string,
    input: ICompetitionInput
  ): Promise<string> {
    const sanitized = sanitizeCompetitionInput(input);
    const competitionRef = doc(this.competitionsCollection);

    await setDoc(competitionRef, {
      ...sanitized,
      creatorId: userId,
      creatorName,
      organizer: creatorName,
      participantsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return competitionRef.id;
  }

  async updateCompetition(
    competitionId: string,
    userId: string,
    updates: ICompetitionUpdate
  ): Promise<void> {
    const competitionRef = doc(this.competitionsCollection, competitionId);
    const competitionDoc = await getDoc(competitionRef);

    if (!competitionDoc.exists()) {
      throw new Error("Competition not found");
    }

    const existingData = competitionDoc.data() as CompetitionDoc;
    if (existingData.creatorId !== userId) {
      throw new Error("You can only edit competitions you created");
    }

    const mergedInput: ICompetitionInput = {
      title: updates.title ?? existingData.title ?? "",
      description: updates.description ?? existingData.description ?? "",
      category: updates.category ?? existingData.category ?? "",
      difficulty: updates.difficulty ?? existingData.difficulty ?? "beginner",
      prizeAmount: updates.prizeAmount ?? existingData.prizeAmount ?? 0,
      prizeCurrency: updates.prizeCurrency ?? existingData.prizeCurrency ?? "USD",
      startDate:
        updates.startDate ?? existingData.startDate?.toDate?.() ?? new Date(),
      deadline: updates.deadline ?? existingData.deadline?.toDate?.() ?? new Date(),
      maxParticipants:
        updates.maxParticipants !== undefined
          ? updates.maxParticipants
          : existingData.maxParticipants,
      tags: updates.tags ?? existingData.tags ?? [],
    };

    const sanitized = sanitizeCompetitionInput(mergedInput);

    await updateDoc(competitionRef, {
      ...sanitized,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteCompetition(competitionId: string, userId: string): Promise<void> {
    const competitionRef = doc(this.competitionsCollection, competitionId);
    const competitionDoc = await getDoc(competitionRef);

    if (!competitionDoc.exists()) {
      throw new Error("Competition not found");
    }

    const data = competitionDoc.data() as CompetitionDoc;
    if (data.creatorId !== userId) {
      throw new Error("You can only delete competitions you created");
    }

    await deleteDoc(competitionRef);
  }

  async joinCompetition(competitionId: string): Promise<void> {
    try {
      await api.post("/joinCompetition", { competitionId });
    } catch (error) {
      if (error instanceof ApiError) {
        const message =
          (error.response.data?.error as string) ||
          (error.response.data?.message as string) ||
          "Failed to join competition";
        throw new Error(message);
      }

      throw error;
    }
  }
}

export const competitionService = new CompetitionService();
