import { AUTH_RETURN_KEY } from "@/lib/auth/constants";
import { authDebug } from "@/lib/auth/debug";
import { buildApiUrl, resolveApiBaseUrl } from "@/lib/auth/resolve-api-url";
import { clearAuthStorage, getToken } from "@/lib/auth/token";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiRequestOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  /** When true, rejects before fetch if no token is available */
  requireAuth?: boolean;
  /** Explicit JWT — preferred for execution (from AuthProvider) */
  accessToken?: string | null;
  /** Skip automatic 401 redirect (e.g. login attempt) */
  skipUnauthorizedRedirect?: boolean;
  /** Omit JSON Content-Type (e.g. FormData) */
  skipJsonContentType?: boolean;
};

function resolveAccessToken(explicit?: string | null): string | null {
  const token = (explicit ?? getToken())?.trim() ?? null;
  return token && token.length > 0 ? token : null;
}

function buildHeaders(init: HeadersInit | undefined, options: ApiRequestOptions): Headers {
  const headers = new Headers(init);

  if (!options.skipJsonContentType && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = resolveAccessToken(options.accessToken);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

function redirectToLogin(returnPath?: string): void {
  if (typeof window === "undefined") return;
  const path = returnPath ?? `${window.location.pathname}${window.location.search}`;
  if (path.startsWith("/auth/")) return;
  sessionStorage.setItem(AUTH_RETURN_KEY, path);
  const params = new URLSearchParams({ return: path });
  window.location.href = `/auth/login?${params.toString()}`;
}

export function handleUnauthorized(returnPath?: string): void {
  authDebug("api", "handleUnauthorized — clearing session", { returnPath });
  clearAuthStorage();
  redirectToLogin(returnPath);
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    requireAuth = false,
    accessToken,
    skipUnauthorizedRedirect = false,
    skipJsonContentType = false,
    method,
    body,
    signal,
    headers: initHeaders,
    ...rest
  } = options;

  void rest;

  const token = resolveAccessToken(accessToken);

  if (requireAuth && !token) {
    authDebug("api", "blocked — requireAuth but no token", { path, method: method ?? "GET" });
    if (!skipUnauthorizedRedirect) {
      handleUnauthorized(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/playground");
    }
    throw new ApiError("Authentication required", 401);
  }

  const headers = buildHeaders(initHeaders, { skipJsonContentType, accessToken: token });
  const url = buildApiUrl(path);

  authDebug("api", "request start", {
    path,
    url,
    method: method ?? "GET",
    requireAuth,
    hasAuthHeader: headers.has("Authorization"),
    authPrefix: headers.get("Authorization")?.slice(0, 12),
    tokenPresent: Boolean(token)
  });

  const response = await fetch(url, {
    method,
    body,
    signal,
    headers,
    cache: "no-store",
    credentials: "same-origin"
  });

  authDebug("api", "response", { path, status: response.status, ok: response.ok });

  if (response.status === 401) {
    const bodyJson = await response.json().catch(() => ({ detail: "Unauthorized" }));
    authDebug("api", "401 response", {
      detail: bodyJson,
      hadAuthHeader: headers.has("Authorization")
    });
    if (!skipUnauthorizedRedirect) {
      handleUnauthorized(typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined);
    }
    throw new ApiError(String((bodyJson as { detail?: string }).detail ?? "Unauthorized"), 401, bodyJson);
  }

  if (!response.ok) {
    const bodyJson = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(String((bodyJson as { detail?: string }).detail ?? "Request failed"), response.status, bodyJson);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export { resolveApiBaseUrl } from "@/lib/auth/resolve-api-url";

export function getApiUrl() {
  return resolveApiBaseUrl();
}

export function getWsBaseUrl() {
  const ws = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (ws) return ws.replace(/\/$/, "");
  const api = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "http://localhost:8000";
  return api.replace(/^http/, "ws");
}
