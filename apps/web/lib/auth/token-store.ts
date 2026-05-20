/** In-memory JWT cache — always synced when setToken/clear runs (fixes stale reads during orchestration). */
let memoryToken: string | null = null;

export function getMemoryToken(): string | null {
  return memoryToken;
}

export function setMemoryToken(token: string | null): void {
  memoryToken = token ? token.trim() : null;
}

export function isJwtShape(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}
