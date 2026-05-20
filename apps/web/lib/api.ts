/**
 * Public API surface — all authenticated traffic goes through apiRequest.
 */
import { apiRequest, getWsBaseUrl } from "@/lib/auth/api-client";
import { getToken, setStoredUser, setToken } from "@/lib/auth/token";
import type { AuthUser } from "@/lib/api-types";

export type {
  Agent,
  AuthUser,
  DashboardSummary,
  Execution,
  ExecutionStep,
  Notification
} from "@/lib/api-types";

export { ApiError, getApiUrl, handleUnauthorized, resolveApiBaseUrl } from "@/lib/auth/api-client";
export { getToken, hasAuthToken, setToken, clearAuthStorage, getStoredUser } from "@/lib/auth/token";

export function getNotificationsWsUrl() {
  const token = getToken();
  if (!token) return null;
  return `${getWsBaseUrl()}/v1/notifications/ws?token=${encodeURIComponent(token)}`;
}

function extractAccessToken(data: { access_token?: string; accessToken?: string }): string {
  const token = data.access_token ?? data.accessToken;
  if (!token || typeof token !== "string") {
    throw new Error("Login response did not include access_token");
  }
  return token;
}

/** Authenticated fetch with automatic Bearer injection */
export async function api<T>(
  path: string,
  init: RequestInit = {},
  options?: { requireAuth?: boolean; accessToken?: string | null }
): Promise<T> {
  return apiRequest<T>(path, {
    ...init,
    requireAuth: options?.requireAuth,
    accessToken: options?.accessToken
  });
}

export async function login(email: string, password: string) {
  const data = await apiRequest<{ access_token: string; accessToken?: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipUnauthorizedRedirect: true
  });
  const token = extractAccessToken(data);
  setToken(token);
  setStoredUser(data.user);
  return { access_token: token, user: data.user };
}

export async function signup(name: string, email: string, password: string) {
  const data = await apiRequest<{ access_token: string; accessToken?: string; user: AuthUser }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
    skipUnauthorizedRedirect: true
  });
  const token = extractAccessToken(data);
  setToken(token);
  setStoredUser(data.user);
  return { access_token: token, user: data.user };
}

export async function deployAgent(agentId: string, organizationId: string, accessToken?: string | null) {
  return apiRequest<{ deployment_id: string; endpoint_url: string; status: string }>("/agents/deploy", {
    method: "POST",
    body: JSON.stringify({ agent_id: agentId, organization_id: organizationId, environment: "production" }),
    requireAuth: true,
    accessToken
  });
}
