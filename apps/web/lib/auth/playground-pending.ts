import { PENDING_PLAYGROUND_KEY } from "@/lib/auth/constants";

export type PendingPlaygroundState = {
  agentId: string;
  input: string;
  model: string;
  runtime: string;
  savedAt: string;
};

export function savePendingPlayground(state: Omit<PendingPlaygroundState, "savedAt">): void {
  if (typeof window === "undefined") return;
  const payload: PendingPlaygroundState = { ...state, savedAt: new Date().toISOString() };
  sessionStorage.setItem(PENDING_PLAYGROUND_KEY, JSON.stringify(payload));
}

export function loadPendingPlayground(): PendingPlaygroundState | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_PLAYGROUND_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingPlaygroundState;
  } catch {
    return null;
  }
}

export function clearPendingPlayground(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_PLAYGROUND_KEY);
}
