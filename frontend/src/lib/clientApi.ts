import { ApiError, toApiError } from "./apiError";
import { PUBLIC_API_URL } from "./config";
import { getAccessToken, notifySessionExpired, setAccessToken } from "./tokenStore";
import type { User } from "./types";

interface AuthResponse {
  user: User;
  accessToken: string;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
}

let refreshInFlight: Promise<AuthResponse | null> | null = null;

export function refreshSession(): Promise<AuthResponse | null> {
  refreshInFlight ??= fetch(`${PUBLIC_API_URL}/api/auth/refresh`, { method: "POST", credentials: "include" })
    .then(async (response) => {
      if (!response.ok) return null;
      const session = (await response.json()) as AuthResponse;
      setAccessToken(session.accessToken);
      return session;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  return fetch(`${PUBLIC_API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    signal: options.signal,
    cache: "no-store",
  });
}

export async function clientFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && !path.startsWith("/api/auth/")) {
    const session = await refreshSession();
    if (!session) {
      setAccessToken(null);
      notifySessionExpired();
      throw new ApiError(401, "Your session has expired. Please sign in again.", "UNAUTHORIZED");
    }
    response = await send(path, options);
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
