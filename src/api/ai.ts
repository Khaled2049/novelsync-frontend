import { doc, onSnapshot } from "firebase/firestore";
import api, { getApiErrorMessage } from "./index";
import { firestore } from "@/config/firebase";

// ---------------------------------------------------------------------------
// Brainstorm
// ---------------------------------------------------------------------------

export interface BrainstormIdeasRequest {
  storyId: string;
  type: "characters" | "plots" | "places" | "themes";
  prompt?: string;
  count?: number;
}

export interface BrainstormIdea {
  text: string;
}

export interface BrainstormIdeasResponse {
  data: {
    storyId: string;
    type: "characters" | "plots" | "places" | "themes";
    ideas: BrainstormIdea[];
  };
}

export const brainstormIdeas = async (
  request: BrainstormIdeasRequest,
): Promise<BrainstormIdeasResponse> => {
  try {
    const response = await api.post<BrainstormIdeasResponse>(
      "/brainstormIdeas",
      request,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to generate brainstorm ideas"),
    );
  }
};

// ---------------------------------------------------------------------------
// Generate next lines
// ---------------------------------------------------------------------------

export interface GenerateNextLinesRequest {
  storyId: string;
  content: string;
  cursorPosition: number;
  chapterId?: string;
}

export interface GenerateNextLinesResponse {
  success: boolean;
  data: {
    storyId: string;
    suggestions: string[];
  };
  error: string | null;
}

export const generateNextLines = async (
  request: GenerateNextLinesRequest,
): Promise<GenerateNextLinesResponse> => {
  try {
    const response = await api.post<GenerateNextLinesResponse>(
      "/generateNextLines",
      request,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to generate next lines"));
  }
};

// ---------------------------------------------------------------------------
// Generate chapter (async job)
// ---------------------------------------------------------------------------

export interface GenerateChapterRequest {
  storyId: string;
  chapterNumber: number;
  /** Float ordering key of the chapter position (source of truth). */
  order?: number;
  /** When set, generate into this existing chapter instead of creating a new one. */
  chapterId?: string;
}

export interface GenerateChapterStartResponse {
  jobId: string;
  status: "queued";
  message: string;
}

export interface GenerationJob {
  id: string;
  storyId: string;
  type: string;
  status: string;
  progress?: number;
  result?: {
    chapterId?: string;
    chapterNumber?: number;
    title?: string;
    [key: string]: unknown;
  };
  error?: string;
}

export const generateChapter = async (
  request: GenerateChapterRequest,
): Promise<GenerateChapterStartResponse> => {
  try {
    const response = await api.post<GenerateChapterStartResponse>(
      "/generateChapter",
      request,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to start chapter generation"),
    );
  }
};

// ---------------------------------------------------------------------------
// Summarize chapter (synchronous)
// ---------------------------------------------------------------------------

export interface SummarizeChapterRequest {
  storyId: string;
  chapterId: string;
}

export interface SummarizeChapterResponse {
  summary: string;
}

export const summarizeChapter = async (
  request: SummarizeChapterRequest,
): Promise<SummarizeChapterResponse> => {
  try {
    const response = await api.post<SummarizeChapterResponse>(
      "/summarizeChapter",
      request,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to summarize chapter"));
  }
};

export const getJobStatus = async (jobId: string): Promise<GenerationJob> => {
  if (!jobId?.trim()) {
    throw new Error("Missing jobId for job status request");
  }

  const encodedJobId = encodeURIComponent(jobId);

  try {
    console.debug("[generateChapter] checking job status", {
      jobId,
      endpoint: `/getJobStatus/${encodedJobId}`,
    });

    const response = await api.get<GenerationJob>(
      `/getJobStatus/${encodedJobId}`,
    );
    console.debug("[generateChapter] job status response", response.data);
    return response.data;
  } catch (error: unknown) {
    // Backward-compat fallback in case route param parsing fails in deployed function.
    try {
      console.debug("[generateChapter] retrying job status with query param", {
        jobId,
      });
      const fallbackResponse = await api.get<GenerationJob>(`/getJobStatus`, {
        params: { jobId },
      });
      console.debug(
        "[generateChapter] job status response (query fallback)",
        fallbackResponse.data,
      );
      return fallbackResponse.data;
    } catch (fallbackError: unknown) {
      throw new Error(
        getApiErrorMessage(fallbackError, "Failed to fetch job status"),
      );
    }
  }
};

/**
 * Resolve when a generation job reaches a terminal state, driven by a realtime
 * Firestore listener on the job doc (`jobs/{jobId}`) — no polling. The worker
 * writes progress (10/30/70/100) and the terminal `status`, and each write
 * pushes a snapshot here. `onProgress` lets the UI render a live progress bar.
 */
export const waitForJobCompletion = (
  jobId: string,
  options?: { timeoutMs?: number; onProgress?: (progress: number) => void },
): Promise<GenerationJob> => {
  const timeoutMs = options?.timeoutMs ?? 120000;

  if (!jobId?.trim()) {
    return Promise.reject(new Error("Missing jobId for job status request"));
  }

  return new Promise<GenerationJob>((resolve, reject) => {
    const ref = doc(firestore, "jobs", jobId);

    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      fn();
    };

    const timer = setTimeout(() => {
      finish(() =>
        reject(new Error("Chapter generation timed out. Please try again.")),
      );
    }, timeoutMs);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        // The doc may not be visible on the first snapshot (created moments
        // after the HTTP response); wait for the next event.
        if (!snapshot.exists()) return;

        const job = { id: snapshot.id, ...snapshot.data() } as GenerationJob;

        console.debug("[generateChapter] job snapshot", {
          jobId,
          status: job.status,
          progress: job.progress,
        });

        if (typeof job.progress === "number") {
          options?.onProgress?.(job.progress);
        }

        if (job.status === "completed") {
          finish(() => resolve(job));
        } else if (job.status === "failed") {
          finish(() =>
            reject(new Error(job.error || "Chapter generation failed")),
          );
        }
      },
      (error) => {
        finish(() => reject(error));
      },
    );
  });
};

// ---------------------------------------------------------------------------
// Generate story choices
// ---------------------------------------------------------------------------

export interface StoryChoice {
  label: string;
  sceneText: string;
  isFinal?: boolean;
}

export interface GenerateStoryChoicesRequest {
  storyId: string;
  mode: "opening" | "continuation" | "ending";
  currentContent?: string;
  chapterId?: string;
  turnCount?: number;
}

export interface GenerateStoryChoicesResponse {
  openingScene?: string;
  choices: StoryChoice[];
}

export const generateStoryChoices = async (
  request: GenerateStoryChoicesRequest,
): Promise<GenerateStoryChoicesResponse> => {
  try {
    const response = await api.post<
      | { success: boolean; data: GenerateStoryChoicesResponse }
      | GenerateStoryChoicesResponse
    >("/generateStoryChoices", request);
    const responseData = response.data;
    if ("success" in responseData && "data" in responseData) {
      return (
        responseData as { success: boolean; data: GenerateStoryChoicesResponse }
      ).data;
    }
    return responseData as GenerateStoryChoicesResponse;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to generate story choices"),
    );
  }
};

// ---------------------------------------------------------------------------
// Enhance text
// ---------------------------------------------------------------------------

export interface EnhanceTextRequest {
  storyId: string;
  action: "expand" | "dialogue" | "rewrite";
  selectedText: string;
  chapterId?: string;
}

export interface EnhanceTextResponse {
  success: boolean;
  data: {
    storyId: string;
    action: string;
    enhancedText: string;
  };
  error: string | null;
}

export const enhanceText = async (
  request: EnhanceTextRequest,
): Promise<EnhanceTextResponse> => {
  try {
    const response = await api.post<EnhanceTextResponse>(
      "/enhanceText",
      request,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to enhance text"));
  }
};

// ---------------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------------

export type WizardEnhanceType =
  | "premise"
  | "character"
  | "place"
  | "conflict"
  | "blueprint";

export interface WizardEnhanceRequest {
  type: WizardEnhanceType;
  data: Record<string, unknown>;
}

export interface BlueprintResult {
  premise?: string;
  characters?: {
    name: string;
    description: string;
    personality?: string;
    backstory?: string;
  }[];
  places?: {
    name: string;
    description: string;
    atmosphere?: string;
    history?: string;
  }[];
  conflict?: string;
}

export interface WizardEnhanceResponse {
  success: boolean;
  data?: {
    /** Single enhanced string — returned for premise/character/place/conflict types */
    enhanced?: string;
    /** Full enriched blueprint — returned for blueprint type */
    blueprint?: BlueprintResult;
  };
  error?: string;
}

export const enhanceWizardInput = async (
  request: WizardEnhanceRequest,
): Promise<WizardEnhanceResponse> => {
  const response = await api.post<WizardEnhanceResponse>(
    "/enhanceWizardInput",
    request,
  );
  return response.data;
};
