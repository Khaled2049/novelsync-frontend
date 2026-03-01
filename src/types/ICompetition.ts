export type CompetitionStatus = "active" | "upcoming" | "completed";

export type CompetitionDifficulty = "beginner" | "intermediate" | "advanced";

export interface ISponsor {
  id?: string;
  name: string;
  logo?: string; // URL to sponsor logo
  website?: string; // Sponsor website URL
  message?: string; // Pinned sponsor message
  tier?: "platinum" | "gold" | "silver" | "bronze"; // Sponsor tier for different visibility levels
}

export interface ICompetition {
  id: string;
  title: string;
  description: string;
  prizeAmount: number;
  prizeCurrency: string;
  deadline: Date;
  startDate: Date;
  status: CompetitionStatus;
  difficulty: CompetitionDifficulty;
  participants: number;
  maxParticipants?: number;
  tags: string[];
  category: string;
  organizer: string;
  creatorId?: string;
  creatorName?: string;
  isJoined?: boolean;
  rules?: string[];
  evaluationCriteria?: string;
  sponsor?: ISponsor; // Optional sponsor information
}

export interface ICompetitionInput {
  title: string;
  description: string;
  prizeAmount: number;
  prizeCurrency: string;
  startDate: Date;
  deadline: Date;
  difficulty: CompetitionDifficulty;
  maxParticipants?: number | null;
  tags: string[];
  category: string;
}

export interface ICompetitionUpdate
  extends Partial<
    Pick<
      ICompetitionInput,
      | "title"
      | "description"
      | "prizeAmount"
      | "prizeCurrency"
      | "startDate"
      | "deadline"
      | "difficulty"
      | "maxParticipants"
      | "tags"
      | "category"
    >
  > {}
