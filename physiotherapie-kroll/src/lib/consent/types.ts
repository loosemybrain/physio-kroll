import { z } from "zod"

/**
 * Consent categories for GDPR/ePrivacy compliance
 */
export type ConsentCategory = "necessary" | "functional" | "analytics" | "marketing"

/**
 * Consent state structure
 */
export const consentStateSchema = z.object({
  v: z.number().int().positive(), // Version for future migrations
  necessary: z.boolean(),
  functional: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  ts: z.number().int().positive(), // Timestamp when consent was given/updated
})

export type ConsentState = z.infer<typeof consentStateSchema>

/**
 * Default consent state (only necessary = true)
 */
export const defaultConsentState: ConsentState = {
  v: 1,
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  ts: Date.now(),
}

/**
 * Cookie name for consent storage
 */
export const CONSENT_COOKIE_NAME = "pc_consent"

/**
 * Cookie max age in seconds (180 days)
 */
export const CONSENT_COOKIE_MAX_AGE = 180 * 24 * 60 * 60

/**
 * Category labels and descriptions (German)
 */
export const consentCategoryLabels: Record<ConsentCategory, { label: string; description: string }> = {
  necessary: {
    label: "Notwendig",
    description: "Erforderlich für Grundfunktionen der Website (z.B. Ihre Cookie-Auswahl). Diese Cookies können nicht deaktiviert werden.",
  },
  functional: {
    label: "Funktional/Medien",
    description: "Lädt externe Inhalte wie Karten oder Videos. Diese werden nur mit Ihrer Zustimmung geladen.",
  },
  analytics: {
    label: "Analyse",
    description: "Hilft uns zu verstehen, wie Besucher mit der Website interagieren. Derzeit nicht aktiv genutzt.",
  },
  marketing: {
    label: "Marketing",
    description: "Wird für personalisierte Werbung verwendet. Derzeit nicht aktiv genutzt.",
  },
}
