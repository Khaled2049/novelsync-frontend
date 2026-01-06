export type CompetitionStatus = "active" | "upcoming" | "completed";

export type CompetitionDifficulty = "beginner" | "intermediate" | "advanced";

export interface ISponsor {
  id: string;
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
  rules?: string[];
  evaluationCriteria?: string;
  sponsor?: ISponsor; // Optional sponsor information
}
