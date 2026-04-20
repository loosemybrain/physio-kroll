import { z } from "zod"

/**
 * Produktive Consent-Kategorien (DSGVO/ePrivacy) — nur notwendig + externe Medien.
 */
export type ConsentCategory = "necessary" | "externalMedia"

/** Aktuelles Cookie-Format (Version 2). */
export const CONSENT_SCHEMA_VERSION = 2 as const

/**
 * Persistierter Consent-State (schlank).
 * Alte Cookies mit `functional` / `analytics` / `marketing` werden beim Lesen migriert (siehe cookie.ts).
 */
export const consentStateSchema = z.object({
  v: z.number().int().positive(),
  necessary: z.literal(true),
  externalMedia: z.boolean(),
  ts: z.number().int().positive(),
})

export type ConsentState = z.infer<typeof consentStateSchema>

export const defaultConsentState: ConsentState = {
  v: CONSENT_SCHEMA_VERSION,
  necessary: true,
  externalMedia: false,
  ts: Date.now(),
}

export const CONSENT_COOKIE_NAME = "pc_consent"

/** Cookie max age in seconds (180 days) */
export const CONSENT_COOKIE_MAX_AGE = 180 * 24 * 60 * 60

export const consentCategoryLabels: Record<
  ConsentCategory,
  { label: string; description: string }
> = {
  necessary: {
    label: "Notwendig",
    description:
      "Erforderlich für Grundfunktionen der Website (z. B. Ihre Cookie-Auswahl). Diese Cookies können nicht deaktiviert werden.",
  },
  externalMedia: {
    label: "Externe Medien",
    description:
      "Ermöglicht das Einbetten von Inhalten Dritter (z. B. Google Maps, Facebook/Instagram-Embeds). Reine Footer-Links zu Social-Profilen fallen nicht darunter. Ohne Zustimmung werden keine externen Embed-Ressourcen geladen.",
  },
}
