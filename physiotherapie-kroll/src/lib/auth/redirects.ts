const LOCAL_FALLBACK_URL = "http://localhost:3000"

export function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin
  }

  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")

  if (!envUrl) return LOCAL_FALLBACK_URL

  try {
    return new URL(envUrl).origin
  } catch {
    return LOCAL_FALLBACK_URL
  }
}

export function buildAbsoluteUrl(path: string): string {
  const safePath = normalizeInternalRedirectTarget(path, "/")
  return new URL(safePath, getBaseUrl()).toString()
}

/**
 * Erlaubt nur interne Pfade wie /admin/pages?foo=bar.
 * Verhindert externe Ziele (open redirect).
 */
export function normalizeInternalRedirectTarget(
  candidate: string | null | undefined,
  fallback = "/admin/pages"
): string {
  if (!candidate) return fallback
  const value = candidate.trim()
  if (!value.startsWith("/")) return fallback
  if (value.startsWith("//")) return fallback
  if (value.includes("://")) return fallback
  return value
}

export function toLoginRedirect(nextPath: string): string {
  const safeNext = normalizeInternalRedirectTarget(nextPath, "/admin/pages")
  return `/auth/login?next=${encodeURIComponent(safeNext)}`
}

