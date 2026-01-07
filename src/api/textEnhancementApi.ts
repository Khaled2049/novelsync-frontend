import axiosInstance from "./index";

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

/**
 * Enhance selected text using AI.
 *
 * @param request - The enhancement request parameters
 * @returns Promise resolving to enhanced text response
 * @throws Error if the request fails
 */
export const enhanceText = async (
  request: EnhanceTextRequest
): Promise<EnhanceTextResponse> => {
  try {
    const response = await axiosInstance.post<EnhanceTextResponse>(
      "/enhanceText",
      request
    );

    // Handle different response formats
    const responseData = response.data;

    if ("success" in responseData && "data" in responseData) {
      return responseData as EnhanceTextResponse;
    }

    return responseData as EnhanceTextResponse;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.details ||
      error.message ||
      "Failed to enhance text";
    throw new Error(errorMessage);
  }
};
