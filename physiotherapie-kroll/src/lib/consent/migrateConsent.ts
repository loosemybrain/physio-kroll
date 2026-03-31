import { CONSENT_SCHEMA_VERSION, consentStateSchema, type ConsentState } from "./types"

/**
 * Rohdaten aus dem Cookie (beliebige ältere Form).
 * `functional` wird nur noch gelesen und auf `externalMedia` gemappt, nicht mehr geschrieben.
 */
function coerceBoolean(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined
}

/**
 * Migriert Legacy-Payloads → schlanker ConsentState (v2).
 */
export function migrateLegacyConsentPayload(raw: Record<string, unknown>): ConsentState {
  const externalFromField = coerceBoolean(raw.externalMedia)
  const externalFromLegacyFunctional = coerceBoolean(raw.functional)
  const externalMedia =
    externalFromField !== undefined
      ? externalFromField
      : externalFromLegacyFunctional !== undefined
        ? externalFromLegacyFunctional
        : false

  const ts = typeof raw.ts === "number" && Number.isFinite(raw.ts) ? raw.ts : Date.now()

  return {
    v: CONSENT_SCHEMA_VERSION,
    necessary: true,
    externalMedia,
    ts,
  }
}

/**
 * Parst JSON-Payload aus dem Cookie: zuerst aktuelles Schema, sonst Legacy-Migration.
 */
export function parseConsentFromUnknown(data: unknown): ConsentState | null {
  if (data === null || typeof data !== "object") return null

  const slim = consentStateSchema.safeParse(data)
  if (slim.success) {
    return slim.data
  }

  return migrateLegacyConsentPayload(data as Record<string, unknown>)
}
