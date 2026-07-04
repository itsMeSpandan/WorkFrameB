/**
 * Client-side API helper that attaches the JWT access token from localStorage.
 * Use this in all client components to call protected API routes.
 */

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function setAccessToken(token: string): void {
  localStorage.setItem("accessToken", token);
}

export function clearAccessToken(): void {
  localStorage.removeItem("accessToken");
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Fetch wrapper that automatically adds the Authorization header.
 * Returns the parsed JSON response.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 — token expired or invalid
  if (response.status === 401) {
    clearAccessToken();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    throw new Error("Session expired. Please sign in again.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}
