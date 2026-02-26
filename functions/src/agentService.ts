/** Service for communicating with the Python agent. */
import * as logger from "firebase-functions/logger";
import { defineString } from "firebase-functions/params";
import axios, { AxiosError } from "axios";
import { GoogleAuth } from "google-auth-library";

const agentServiceUrlParam = defineString("AGENT_SERVICE_URL", {
  default: "http://localhost:8000",
  description: "URL of the Python agent service (Cloud Run or local)",
});

export interface AgentRequest {
  action: string;
  parameters: Record<string, unknown>;
}

export interface AgentResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

const isLocalDevelopment = process.env.FUNCTIONS_EMULATOR === "true";

function getAgentServiceUrl(): string {
  const url = agentServiceUrlParam.value();
  if (!url) {
    throw new Error("AGENT_SERVICE_URL must be set in production");
  }
  return url.replace(/\/$/, "");
}

// Initialize Auth only if not local
const auth = isLocalDevelopment ? null : new GoogleAuth();

/**
 * Get an identity token for Cloud Run authentication.
 */
async function getIdentityToken(): Promise<string | null> {
  const url = getAgentServiceUrl();
  if (isLocalDevelopment || url.includes("localhost")) {
    return null;
  }

  try {
    if (!auth) return null;
    const client = await auth.getIdTokenClient(url);
    const headers = await client.getRequestHeaders();
    return headers.Authorization?.split(" ")[1] || null;
  } catch (error) {
    logger.error("Error getting identity token", error);
    return null;
  }
}

/**
 * Call the Python agent service.
 */
export async function callAgent(
  action: string,
  parameters: Record<string, unknown>,
): Promise<AgentResponse> {
  const agentUrl = getAgentServiceUrl();
  const request: AgentRequest = { action, parameters };

  try {
    logger.info(`Calling agent service: ${action}`, {
      url: `${agentUrl}/agent/execute`,
      parameters: Object.keys(parameters),
    });

    const identityToken = await getIdentityToken();
    logger.info(`Identity token obtained: ${identityToken ? "yes" : "no"}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (identityToken) {
      headers.Authorization = `Bearer ${identityToken}`;
    }

    logger.info(`Making POST request to agent service...`, {
      url: `${agentUrl}/agent/execute`,
      action,
      requestSize: JSON.stringify(request).length,
    });

    const startTime = Date.now();
    const response = await axios.post(
      `${agentUrl}/agent/execute`,
      request,
      {
        headers,
        timeout: 300000,
      },
    );
    const duration = Date.now() - startTime;

    logger.info(`Agent service response received for ${action}`, {
      status: response.status,
      hasData: !!response.data,
      durationMs: duration,
      responseKeys: response.data ? Object.keys(response.data) : [],
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data
        ? JSON.stringify(axiosError.response.data)
        : axiosError.message;

      // Build detailed error info
      const errorDetails = {
        code: axiosError.code,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        message: axiosError.message,
        url: `${agentUrl}/agent/execute`,
        isLocalDevelopment,
      };

      // Check if it's a connection refused error
      if (
        axiosError.code === "ECONNREFUSED" ||
        errorMessage.includes("ECONNREFUSED")
      ) {
        const helpfulError = isLocalDevelopment
          ? `Connection refused to ${agentUrl}. ` +
            `Make sure the Python agent service is running locally on port 8000. ` +
            `Start it with: cd python && python server.py`
          : `Connection refused to ${agentUrl}. ` +
            `This usually means AGENT_SERVICE_URL environment variable is not set ` +
            `or is set to localhost. Please set it to your Cloud Run service URL ` +
            `(e.g., https://story-agent-xxxxx.run.app) in Firebase Console → ` +
            `Functions → Configuration → Environment variables.`;

        logger.error(
          `Agent service error [${action}]: ${helpfulError}`,
          errorDetails,
        );

        return {
          success: false,
          error: helpfulError,
        };
      }

      // Log detailed error information
      logger.error(
        `Agent service error [${action}]: ${errorMessage}`,
        errorDetails,
      );

      return {
        success: false,
        error: `${errorMessage}${
          axiosError.code ? ` (${axiosError.code})` : ""
        }${
          axiosError.response?.status
            ? ` [HTTP ${axiosError.response.status}]`
            : ""
        }`,
      };
    }

    const genericError = error instanceof Error ? error.message : String(error);
    logger.error(`Error calling agent service: ${action}`, {
      error: genericError,
      url: `${agentUrl}/agent/execute`,
      isLocalDevelopment,
    });
    return {
      success: false,
      error: genericError,
    };
  }
}

/**
 * Call agent with retry logic.
 */
export async function callAgentWithRetry(
  action: string,
  parameters: Record<string, unknown>,
  maxRetries = 3,
  retryDelay = 1000,
): Promise<AgentResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await callAgent(action, parameters);

    // If successful, return immediately
    if (result.success) {
      return result;
    }

    // If we are on the last attempt, return the error
    if (attempt === maxRetries) {
      return result;
    }

    // LOGIC FIX: Wait and retry if it failed (and we have attempts left)
    logger.warn(
      `Agent call failed (${action}). Retrying ${attempt}/${maxRetries} in ${retryDelay}ms. Error: ${result.error}`,
    );

    await new Promise((resolve) => setTimeout(resolve, retryDelay));
    retryDelay *= 2; // Exponential backoff
  }

  return {
    success: false,
    error: "Max retries exceeded",
  };
}
