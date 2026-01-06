import axiosInstance from "./index";

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

/**
 * Generate brainstorming ideas synchronously (characters, plots, places, or themes).
 *
 * @param request - The brainstorm request parameters
 * @returns Promise resolving to brainstorm ideas response
 * @throws Error if the request fails
 */
export const brainstormIdeas = async (
  request: BrainstormIdeasRequest
): Promise<BrainstormIdeasResponse> => {
  try {
    const response = await axiosInstance.post<BrainstormIdeasResponse>(
      "/brainstormIdeas",
      request
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to generate brainstorm ideas";
    throw new Error(errorMessage);
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
  request: GenerateNextLinesRequest
): Promise<GenerateNextLinesResponse> => {
  try {
    const response = await axiosInstance.post<GenerateNextLinesResponse>(
      "/generateNextLines",
      request
    );

    // Handle different response formats
    const responseData = response.data;

    if ("success" in responseData && "data" in responseData) {
      return responseData as GenerateNextLinesResponse;
    }

    return responseData as GenerateNextLinesResponse;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.details ||
      error.message ||
      "Failed to generate next lines";
    throw new Error(errorMessage);
  }
};
