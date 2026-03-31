import {
  CONSENT_COOKIE_MAX_AGE,
  CONSENT_COOKIE_NAME,
  CONSENT_SCHEMA_VERSION,
  type ConsentCategory,
  type ConsentState,
} from "./types"
import { parseConsentFromUnknown } from "./migrateConsent"

export type { ConsentCategory, ConsentState } from "./types"

/** Nur schlanke Felder persistieren (kein functional/analytics/marketing). */
function toPersistableConsent(consent: ConsentState): ConsentState {
  return {
    v: Math.max(consent.v, CONSENT_SCHEMA_VERSION),
    necessary: true,
    externalMedia: consent.externalMedia,
    ts: consent.ts,
  }
}

/**
 * Parse consent cookie from document.cookie (client-side).
 * Legacy: `functional` wird einmalig auf `externalMedia` gemappt.
 */
export function getConsentFromDocumentCookie(): ConsentState | null {
  if (typeof document === "undefined") return null

  const cookies = document.cookie.split(";")
  const consentCookie = cookies.find((cookie) => cookie.trim().startsWith(`${CONSENT_COOKIE_NAME}=`))

  if (!consentCookie) return null

  try {
    const value = consentCookie.split("=")[1]?.trim()
    if (!value) return null

    const decoded = decodeURIComponent(value)
    const parsed = JSON.parse(decoded) as unknown
    return parseConsentFromUnknown(parsed)
  } catch (error) {
    console.warn("Failed to parse consent cookie:", error)
    return null
  }
}

/**
 * Set consent cookie (client-side) — immer nur schlankes Modell.
 */
export function setConsentCookie(consent: ConsentState): void {
  if (typeof document === "undefined") return

  try {
    const slim = toPersistableConsent({ ...consent, ts: Date.now() })
    const serialized = JSON.stringify(slim)
    const encoded = encodeURIComponent(serialized)

    const isProduction = process.env.NODE_ENV === "production"
    const cookieString = `${CONSENT_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${CONSENT_COOKIE_MAX_AGE}; SameSite=Lax${isProduction ? "; Secure" : ""}`

    document.cookie = cookieString
  } catch (error) {
    console.error("Failed to set consent cookie:", error)
  }
}

/**
 * Parse consent from request cookies (server-side).
 */
export function getConsentFromRequestCookies(cookieHeader: string | null | undefined): ConsentState | null {
  if (!cookieHeader) return null

  try {
    const cookies = cookieHeader.split(";")
    const consentCookie = cookies.find((cookie) => cookie.trim().startsWith(`${CONSENT_COOKIE_NAME}=`))

    if (!consentCookie) return null

    const value = consentCookie.split("=")[1]?.trim()
    if (!value) return null

    const decoded = decodeURIComponent(value)
    const parsed = JSON.parse(decoded) as unknown
    return parseConsentFromUnknown(parsed)
  } catch (error) {
    console.warn("Failed to parse consent cookie from request:", error)
    return null
  }
}

export function hasConsent(consent: ConsentState | null, category: ConsentCategory): boolean {
  if (!consent) return category === "necessary"
  if (category === "necessary") return true
  if (category === "externalMedia") return consent.externalMedia === true
  return false
}
