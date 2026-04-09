import api, { getApiErrorMessage } from "./index";
import { SendChatMessageRequest, SendChatMessageResponse } from "@/types/IChat";

/**
 * Send a chat message with story context for RAG-powered response.
 */
export const sendChatMessage = async (
  request: SendChatMessageRequest,
): Promise<SendChatMessageResponse> => {
  try {
    const response = await api.post<SendChatMessageResponse>(
      "/sendChatMessage",
      request,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to send chat message"),
    );
  }
};
