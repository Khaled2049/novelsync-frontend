import api from "./index";

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

export interface GenerateChapterRequest {
  storyId: string;
  chapterNumber: number;
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

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object") {
    const axiosLikeError = error as {
      response?: { data?: { error?: string; details?: string } };
      message?: string;
    };

    return (
      axiosLikeError.response?.data?.error ||
      axiosLikeError.response?.data?.details ||
      axiosLikeError.message ||
      fallback
    );
  }

  return fallback;
};

/**
 * Generate brainstorming ideas synchronously (characters, plots, places, or themes).
 *
 * @param request - The brainstorm request parameters
 * @returns Promise resolving to brainstorm ideas response
 * @throws Error if the request fails
 */
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

/**
 * Generate next line suggestions for the editor.
 *
 * @param request - The generate next lines request parameters
 * @returns Promise resolving to suggestions response
 * @throws Error if the request fails
 */
export const generateNextLines = async (
  request: GenerateNextLinesRequest,
): Promise<GenerateNextLinesResponse> => {
  try {
    const response = await api.post<GenerateNextLinesResponse>(
      "/generateNextLines",
      request,
    );

    // Handle different response formats
    const responseData = response.data;

    if ("success" in responseData && "data" in responseData) {
      return responseData as GenerateNextLinesResponse;
    }

    return responseData as GenerateNextLinesResponse;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to generate next lines"));
  }
};

/**
 * Start asynchronous chapter generation job.
 *
 * @param request - Chapter generation request parameters
 * @returns Promise resolving to queued job response
 * @throws Error if the request fails
 */
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

/**
 * Fetch asynchronous job status.
 *
 * @param jobId - Job ID returned from the start endpoint
 * @returns Promise resolving to current job state
 * @throws Error if the request fails
 */
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
    // Backward/compat fallback in case route param parsing fails in deployed function.
    try {
      console.debug("[generateChapter] retrying job status with query param", {
        jobId,
      });
      const fallbackResponse = await api.get<GenerationJob>(
        `/getJobStatus`,
        { params: { jobId } },
      );
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
 * Poll a generation job until it reaches completed or failed state.
 */
export const waitForJobCompletion = async (
  jobId: string,
  options?: { timeoutMs?: number; pollIntervalMs?: number },
): Promise<GenerationJob> => {
  const timeoutMs = options?.timeoutMs ?? 120000;
  const pollIntervalMs = options?.pollIntervalMs ?? 2000;
  const startedAt = Date.now();

  let attempt = 0;

  while (Date.now() - startedAt < timeoutMs) {
    attempt += 1;
    const job = await getJobStatus(jobId);
    const elapsedMs = Date.now() - startedAt;

    console.debug("[generateChapter] poll", {
      attempt,
      elapsedMs,
      timeoutMs,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
    });

    if (job.status === "completed") {
      return job;
    }

    if (job.status === "failed") {
      throw new Error(job.error || "Chapter generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("Chapter generation timed out. Please try again.");
};
