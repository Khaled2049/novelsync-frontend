/** Service for communicating with the Python agent. */
import * as logger from "firebase-functions/logger";
import { defineString } from "firebase-functions/params";
import { GoogleAuth } from "google-auth-library";
import { ProviderConfig } from "./aiSettings";

const agentServiceUrlParam = defineString("AGENT_SERVICE_URL", {
  default: "http://localhost:8000",
  description: "URL of the Python agent service (Cloud Run or local)",
});

export interface AgentRequest {
  action: string;
  parameters: Record<string, unknown>;
  user_id?: string;
  provider_config?: ProviderConfig;
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

class FetchError extends Error {
  code?: string;
  response?: { status: number; statusText: string; data: unknown };

  constructor(
    message: string,
    options?: { code?: string; response?: { status: number; statusText: string; data: unknown } }
  ) {
    super(message);
    this.name = "FetchError";
    this.code = options?.code;
    this.response = options?.response;
  }
}

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
  userId?: string,
  providerConfig?: ProviderConfig,
  firebaseToken?: string,
): Promise<AgentResponse> {
  const agentUrl = getAgentServiceUrl();
  const request: AgentRequest = {
    action,
    parameters,
    ...(userId && { user_id: userId }),
    ...(providerConfig && { provider_config: providerConfig }),
  };

  try {
    logger.info(`Calling agent service: ${action}`, {
      url: `${agentUrl}/agent/execute`,
      parameters: Object.keys(parameters),
      ai_mode: providerConfig ? `BYOK/${providerConfig.provider}` : "platform",
      model: providerConfig?.model ?? "platform-default",
    });

    const identityToken = await getIdentityToken();
    logger.info(`Identity token obtained: ${identityToken ? "yes" : "no"}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (identityToken) {
      headers.Authorization = `Bearer ${identityToken}`;
    }
    if (firebaseToken) {
      headers["X-Firebase-Token"] = firebaseToken;
    }

    logger.info(`Making POST request to agent service...`, {
      url: `${agentUrl}/agent/execute`,
      action,
      requestSize: JSON.stringify(request).length,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    const startTime = Date.now();
    let rawResponse: Response;
    try {
      rawResponse = await fetch(`${agentUrl}/agent/execute`, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const duration = Date.now() - startTime;
    const responseData: unknown = await rawResponse.json().catch(() => null);

    if (!rawResponse.ok) {
      throw new FetchError(
        `HTTP ${rawResponse.status} ${rawResponse.statusText}`,
        {
          response: {
            status: rawResponse.status,
            statusText: rawResponse.statusText,
            data: responseData,
          },
        }
      );
    }

    logger.info(`Agent service response received for ${action}`, {
      status: rawResponse.status,
      hasData: !!responseData,
      durationMs: duration,
      responseKeys: responseData && typeof responseData === "object" ? Object.keys(responseData as object) : [],
    });

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    if (error instanceof FetchError) {
      const agentError = (error.response?.data as any)?.error;
      const friendlyMessage = (typeof agentError === "object" && agentError?.message)
        ? agentError.message
        : (typeof agentError === "string" ? agentError : null);
      const errorMessage = friendlyMessage ?? error.message;

      const errorDetails = {
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        url: `${agentUrl}/agent/execute`,
        isLocalDevelopment,
      };

      if (
        error.code === "ECONNREFUSED" ||
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

      logger.error(
        `Agent service error [${action}]: ${errorMessage}`,
        errorDetails,
      );

      return {
        success: false,
        error: friendlyMessage ?? `${errorMessage}${
          error.code ? ` (${error.code})` : ""
        }${
          error.response?.status
            ? ` [HTTP ${error.response.status}]`
            : ""
        }`,
      };
    }

    // Network errors (ECONNREFUSED, ETIMEDOUT, abort, etc.)
    const networkError = error instanceof Error ? error : new Error(String(error));
    const errorMessage = networkError.message;

    if (errorMessage.includes("ECONNREFUSED")) {
      const helpfulError = isLocalDevelopment
        ? `Connection refused to ${agentUrl}. ` +
          `Make sure the Python agent service is running locally on port 8000. ` +
          `Start it with: cd python && python server.py`
        : `Connection refused to ${agentUrl}. ` +
          `This usually means AGENT_SERVICE_URL environment variable is not set ` +
          `or is set to localhost. Please set it to your Cloud Run service URL ` +
          `(e.g., https://story-agent-xxxxx.run.app) in Firebase Console → ` +
          `Functions → Configuration → Environment variables.`;

      logger.error(`Agent service error [${action}]: ${helpfulError}`, {
        message: errorMessage,
        url: `${agentUrl}/agent/execute`,
        isLocalDevelopment,
      });

      return { success: false, error: helpfulError };
    }

    logger.error(`Error calling agent service: ${action}`, {
      error: errorMessage,
      url: `${agentUrl}/agent/execute`,
      isLocalDevelopment,
    });
    return {
      success: false,
      error: errorMessage,
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
  userId?: string,
  providerConfig?: ProviderConfig,
  firebaseToken?: string,
): Promise<AgentResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await callAgent(action, parameters, userId, providerConfig, firebaseToken);

    // If successful, return immediately
    if (result.success) {
      return result;
    }

    // If we are on the last attempt, return the error
    if (attempt === maxRetries) {
      return result;
    }

    // Don't retry non-transient errors (credits, auth)
    const errMsg = result.error || "";
    if (errMsg.includes("Insufficient AI credits") || errMsg.includes("[HTTP 402]") || errMsg.includes("[HTTP 401]")) {
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
