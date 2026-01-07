import axiosInstance from "./index";
import { SendChatMessageRequest, SendChatMessageResponse } from "@/types/IChat";

/**
 * Send a chat message with story context for RAG-powered response.
 *
 * @param request - The chat message request parameters
 * @returns Promise resolving to chat response
 * @throws Error if the request fails
 */
export const sendChatMessage = async (
  request: SendChatMessageRequest
): Promise<SendChatMessageResponse> => {
  try {
    const response = await axiosInstance.post<SendChatMessageResponse>(
      "/sendChatMessage",
      request
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.details ||
      error.message ||
      "Failed to send chat message";
    throw new Error(errorMessage);
  }
};
