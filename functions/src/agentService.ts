/** Service for communicating with the Python agent. */
import * as logger from "firebase-functions/logger";
import axios, { AxiosError } from "axios";
import { GoogleAuth } from "google-auth-library";

export interface AgentRequest {
  action: string;
  parameters: Record<string, unknown>;
}

export interface AgentResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Configuration for agent service.
 * In production, this should point to the deployed Cloud Run service.
 * For local development, it can point to a local server.
 */
const isLocalDevelopment = process.env.FUNCTIONS_EMULATOR === "true";

// When running in emulator, always use localhost regardless of AGENT_SERVICE_URL
// This prevents accidentally connecting to production Cloud Run from local emulator
const RAW_SERVICE_URL = isLocalDevelopment
  ? "http://localhost:8000"
  : process.env.AGENT_SERVICE_URL || "http://localhost:8000";
const AGENT_SERVICE_URL = RAW_SERVICE_URL.replace(/\/$/, "");

// Initialize Auth only if not local
const auth = isLocalDevelopment ? null : new GoogleAuth();

/**
 * Get an identity token for Cloud Run authentication.
 */
async function getIdentityToken(): Promise<string | null> {
  if (isLocalDevelopment || AGENT_SERVICE_URL.includes("localhost")) {
    return null;
  }

  try {
    if (!auth) return null;
    const client = await auth.getIdTokenClient(AGENT_SERVICE_URL);
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
  parameters: Record<string, unknown>
): Promise<AgentResponse> {
  const request: AgentRequest = { action, parameters };

  try {
    logger.info(`Calling agent service: ${action}`, {
      url: `${AGENT_SERVICE_URL}/agent/execute`,
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
      url: `${AGENT_SERVICE_URL}/agent/execute`,
      action,
      requestSize: JSON.stringify(request).length,
    });

    const startTime = Date.now();
    const response = await axios.post(
      `${AGENT_SERVICE_URL}/agent/execute`,
      request,
      {
        headers,
        timeout: 300000,
      }
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
        url: `${AGENT_SERVICE_URL}/agent/execute`,
        isLocalDevelopment,
      };

      // Check if it's a connection refused error
      if (
        axiosError.code === "ECONNREFUSED" ||
        errorMessage.includes("ECONNREFUSED")
      ) {
        const helpfulError = isLocalDevelopment
          ? `Connection refused to ${AGENT_SERVICE_URL}. ` +
            `Make sure the Python agent service is running locally on port 8000. ` +
            `Start it with: cd python && python server.py`
          : `Connection refused to ${AGENT_SERVICE_URL}. ` +
            `This usually means AGENT_SERVICE_URL environment variable is not set ` +
            `or is set to localhost. Please set it to your Cloud Run service URL ` +
            `(e.g., https://story-agent-xxxxx.run.app) in Firebase Console → ` +
            `Functions → Configuration → Environment variables.`;

        logger.error(
          `Agent service error [${action}]: ${helpfulError}`,
          errorDetails
        );

        return {
          success: false,
          error: helpfulError,
        };
      }

      // Log detailed error information
      logger.error(
        `Agent service error [${action}]: ${errorMessage}`,
        errorDetails
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
      url: `${AGENT_SERVICE_URL}/agent/execute`,
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
  retryDelay = 1000
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
      `Agent call failed (${action}). Retrying ${attempt}/${maxRetries} in ${retryDelay}ms. Error: ${result.error}`
    );

    await new Promise((resolve) => setTimeout(resolve, retryDelay));
    retryDelay *= 2; // Exponential backoff
  }

  return {
    success: false,
    error: "Max retries exceeded",
  };
}
