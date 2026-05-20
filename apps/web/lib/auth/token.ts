import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "@/lib/auth/constants";
import { authDebug } from "@/lib/auth/debug";
import { getMemoryToken, isJwtShape, setMemoryToken } from "@/lib/auth/token-store";
import type { AuthUser } from "@/lib/api-types";

function readStorage(storage: Storage): string | null {
  const raw = storage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;
  if (!isJwtShape(trimmed)) {
    authDebug("token", "invalid JWT shape in storage — ignoring");
    return null;
  }
  return trimmed;
}

function hydrateFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  const fromLocal = readStorage(window.localStorage);
  const fromSession = readStorage(window.sessionStorage);
  const token = fromLocal ?? fromSession;
  if (token) setMemoryToken(token);
  return token;
}

/** Read JWT: memory first, then localStorage, then sessionStorage. */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const cached = getMemoryToken();
  if (cached && isJwtShape(cached)) {
    authDebug("token", "getToken", { present: true, source: "memory" });
    return cached;
  }

  const token = hydrateFromStorage();
  authDebug("token", "getToken", { present: Boolean(token), source: token ? "storage" : "none" });
  return token;
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  const normalized = token.trim();
  if (!isJwtShape(normalized)) {
    authDebug("token", "setToken rejected — not a JWT");
    throw new Error("Invalid access token format");
  }
  setMemoryToken(normalized);
  window.localStorage.setItem(TOKEN_STORAGE_KEY, normalized);
  window.sessionStorage.setItem(TOKEN_STORAGE_KEY, normalized);
  authDebug("token", "setToken", { present: true, length: normalized.length });
}

export function clearToken(): void {
  setMemoryToken(null);
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  authDebug("token", "clearToken");
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_STORAGE_KEY) ?? window.sessionStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(user);
  window.localStorage.setItem(USER_STORAGE_KEY, payload);
  window.sessionStorage.setItem(USER_STORAGE_KEY, payload);
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.sessionStorage.removeItem(USER_STORAGE_KEY);
}

export function clearAuthStorage(): void {
  clearToken();
  clearStoredUser();
}

export function hasAuthToken(): boolean {
  return Boolean(getToken());
}
