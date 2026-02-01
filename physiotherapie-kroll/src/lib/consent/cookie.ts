"use client"

import { consentStateSchema, defaultConsentState, CONSENT_COOKIE_NAME, CONSENT_COOKIE_MAX_AGE, type ConsentCategory, type ConsentState } from "./types"

export type { ConsentCategory, ConsentState } from "./types"

/**
 * Parse consent cookie from document.cookie (client-side)
 * Handles migration from 'functional' to 'externalMedia'
 */
export function getConsentFromDocumentCookie(): ConsentState | null {
  if (typeof document === "undefined") return null

  const cookies = document.cookie.split(";")
  const consentCookie = cookies.find((cookie) => cookie.trim().startsWith(`${CONSENT_COOKIE_NAME}=`))

  if (!consentCookie) return null

  try {
    const value = consentCookie.split("=")[1]?.trim()
    if (!value) return null

    // Decode URI component
    const decoded = decodeURIComponent(value)
    const parsed = JSON.parse(decoded)

    // Validate with Zod
    const validated = consentStateSchema.parse(parsed)
    
    // Migration: if externalMedia is not set, use functional or default to false
    if (validated.externalMedia === undefined) {
      validated.externalMedia = validated.functional ?? false
    }
    
    return validated
  } catch (error) {
    console.warn("Failed to parse consent cookie:", error)
    return null
  }
}

/**
 * Set consent cookie (client-side)
 */
export function setConsentCookie(consent: ConsentState): void {
  if (typeof document === "undefined") return

  try {
    // Update timestamp
    const updatedConsent: ConsentState = {
      ...consent,
      ts: Date.now(),
    }

    // Serialize and encode
    const serialized = JSON.stringify(updatedConsent)
    const encoded = encodeURIComponent(serialized)

    // Build cookie string
    const isProduction = process.env.NODE_ENV === "production"
    const cookieString = `${CONSENT_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${CONSENT_COOKIE_MAX_AGE}; SameSite=Lax${isProduction ? "; Secure" : ""}`

    document.cookie = cookieString
  } catch (error) {
    console.error("Failed to set consent cookie:", error)
  }
}

/**
 * Parse consent from request cookies (server-side)
 * Use this in Server Components or API routes
 */
export function getConsentFromRequestCookies(cookieHeader: string | null | undefined): ConsentState | null {
  if (!cookieHeader) return null

  try {
    const cookies = cookieHeader.split(";")
    const consentCookie = cookies.find((cookie) => cookie.trim().startsWith(`${CONSENT_COOKIE_NAME}=`))

    if (!consentCookie) return null

    const value = consentCookie.split("=")[1]?.trim()
    if (!value) return null

    // Decode URI component
    const decoded = decodeURIComponent(value)
    const parsed = JSON.parse(decoded)

    // Validate with Zod
    const validated = consentStateSchema.parse(parsed)
    return validated
  } catch (error) {
    console.warn("Failed to parse consent cookie from request:", error)
    return null
  }
}

/**
 * Check if a specific category is consented
 */
export function hasConsent(consent: ConsentState | null, category: ConsentCategory): boolean {
  if (!consent) return category === "necessary" // Only necessary is always true

  switch (category) {
    case "necessary":
      return true // Always true
    case "functional":
      // Backward compat: functional falls back to externalMedia
      return consent.functional ?? consent.externalMedia ?? false
    case "externalMedia":
      return consent.externalMedia ?? false
    case "analytics":
      return consent.analytics ?? false
    case "marketing":
      return consent.marketing ?? false
    default:
      return false
  }
}
