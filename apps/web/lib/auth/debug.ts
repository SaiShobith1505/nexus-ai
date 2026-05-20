/** Temporary auth debug logging — enable with NEXT_PUBLIC_AUTH_DEBUG=true */
const ENABLED =
  process.env.NEXT_PUBLIC_AUTH_DEBUG === "true" ||
  (typeof window !== "undefined" && process.env.NODE_ENV === "development");

export function authDebug(scope: string, message: string, data?: Record<string, unknown>) {
  if (!ENABLED) return;
  const safe = data
    ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [
          k,
          k.toLowerCase().includes("token") && typeof v === "string" ? `${v.slice(0, 12)}…(${v.length})` : v
        ])
      )
    : undefined;
  console.debug(`[nexus-auth:${scope}]`, message, safe ?? "");
}
