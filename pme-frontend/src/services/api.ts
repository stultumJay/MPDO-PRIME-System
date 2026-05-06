import { getApiBaseUrl } from "./apiBase";
import { authErrorMessage, clearInvalidSession, getAccessToken } from "./tokenService";

type QueryValue = string | number | boolean | null | undefined;

export type ApiQuery = Record<string, QueryValue>;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Build a stable API path while skipping empty query values.
export function withQuery(path: string, query?: ApiQuery) {
  if (!query) return path;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `${path}${path.includes("?") ? "&" : "?"}${queryString}` : path;
}

// Read error bodies defensively because FastAPI can return JSON or plain text.
async function getErrorMessage(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return `Request failed (${response.status} ${response.statusText})`;

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.detail === "string") return parsed.detail;
    if (Array.isArray(parsed?.detail)) {
      return parsed.detail
        .map((item: { msg?: string } | string) => (typeof item === "string" ? item : item.msg ?? String(item)))
        .join(", ");
    }
  } catch {
    // Plain-text error bodies are already useful.
  }

  return text;
}

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const hasBody = options.body !== undefined && options.body !== null;
  const apiBase = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = url.startsWith("/") ? url : `/${url}`;

  const response = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await getErrorMessage(response);
    if (response.status === 401 || response.status === 403 || message.toLowerCase().includes("invalid token")) {
      clearInvalidSession();
      throw new ApiError(authErrorMessage(), response.status);
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return undefined as T;
}

export function apiFetch<T>(endpoint: string, options?: RequestInit) {
  return apiRequest<T>(endpoint, options);
}

export async function apiBlobRequest(url: string, options: RequestInit = {}): Promise<Blob> {
  const token = getAccessToken();
  const apiBase = getApiBaseUrl().replace(/\/$/, "");
  const endpoint = url.startsWith("/") ? url : `/${url}`;

  const response = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await getErrorMessage(response);
    if (response.status === 401 || response.status === 403 || message.toLowerCase().includes("invalid token")) {
      clearInvalidSession();
      throw new ApiError(authErrorMessage(), response.status);
    }
    throw new ApiError(message, response.status);
  }

  return response.blob();
}