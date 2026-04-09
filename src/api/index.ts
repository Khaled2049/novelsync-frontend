import { auth } from "../config/firebase";

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id";
const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || "us-central1";

const isDevelopment = import.meta.env.MODE === "development";
const baseURL = isDevelopment
  ? `http://localhost:5001/${projectId}/${region}`
  : `https://${region}-${projectId}.cloudfunctions.net`;

export class ApiError extends Error {
  response: { data: Record<string, unknown> };

  constructor(message: string, data: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.response = { data };
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken();
      headers["Authorization"] = `Bearer ${idToken}`;
    } catch (error) {
      console.error("Error getting ID token:", error);
    }
  }
  return headers;
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  options?: { body?: unknown; params?: Record<string, string | number> },
): Promise<{ data: T }> {
  const headers = await getAuthHeaders();

  let url = `${baseURL}${path}`;
  if (options?.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      searchParams.set(key, String(value));
    }
    url += `?${searchParams.toString()}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let responseData: unknown;
  try {
    responseData = await res.json();
  } catch {
    responseData = {};
  }

  if (!res.ok) {
    throw new ApiError(
      res.statusText || `Request failed with status ${res.status}`,
      responseData as Record<string, unknown>,
    );
  }

  return { data: responseData as T };
}

const apiClient = {
  get<T>(path: string, options?: { params?: Record<string, string | number> }) {
    return request<T>("GET", path, options);
  },
  post<T>(path: string, body?: unknown) {
    return request<T>("POST", path, { body });
  },
};

export default apiClient;

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const e = error as {
      response?: { data?: { error?: string; details?: string } };
      message?: string;
    };
    return (
      e.response?.data?.error ||
      e.response?.data?.details ||
      e.message ||
      fallback
    );
  }
  return fallback;
}
