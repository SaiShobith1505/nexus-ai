/**
 * Browser: same-origin `/api` proxy (Next rewrite → FastAPI) so Authorization is never dropped by CORS.
 * Server: direct backend URL for SSR/build.
 */
export function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";

  if (typeof window === "undefined") {
    return configured || "http://localhost:8000";
  }

  if (
    !configured ||
    configured.includes("localhost:8000") ||
    configured.includes("127.0.0.1:8000") ||
    configured === "/api"
  ) {
    return "/api";
  }

  return configured.replace(/\/$/, "");
}

export function buildApiUrl(path: string): string {
  const base = resolveApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (base === "/api") {
    return `/api/v1${normalizedPath}`;
  }
  return `${base}/v1${normalizedPath}`;
}
