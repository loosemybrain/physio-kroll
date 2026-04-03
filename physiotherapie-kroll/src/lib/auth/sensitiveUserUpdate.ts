import type { SupabaseClient } from "@supabase/supabase-js"
import { fetchCurrentAal, parseAalFromAssuranceData, type AalLevel } from "@/lib/auth/mfaAal"

export type VerifiedTotpFactor = {
  id: string
  friendlyName?: string
  factor_type?: string
  factorType?: string
}

type FactorRow = {
  id?: string
  factor_type?: string
  factorType?: string
  status?: string
  friendly_name?: string
}

function isTotp(f: FactorRow): boolean {
  return (f.factor_type ?? f.factorType ?? "").toLowerCase() === "totp"
}

function isVerified(f: FactorRow): boolean {
  return (f.status ?? "").toLowerCase() === "verified"
}

export function extractVerifiedTotpFactors(data: unknown): VerifiedTotpFactor[] {
  const raw = data as { totp?: FactorRow[]; all?: FactorRow[] } | null | undefined
  let list: FactorRow[] = []
  if (Array.isArray(raw?.totp)) list = raw.totp
  else if (Array.isArray(raw?.all)) list = raw.all
  return list
    .filter((f) => isTotp(f) && isVerified(f) && f.id)
    .map((f) => ({
      id: f.id as string,
      friendlyName: f.friendly_name,
      factor_type: f.factor_type ?? f.factorType,
    }))
}

/**
 * Vor updateUser(E-Mail/Passwort): Wenn bereits AAL2 → direkt weiter.
 * Wenn AAL1 und verifizierte TOTP-Faktoren existieren → zuerst MFA-Reauth (kein blindes updateUser).
 * Ohne verifizierte TOTP-Faktoren ist AAL1 für diese Updates i. d. R. ausreichend.
 */
export type SensitiveCredentialsPrep =
  | { status: "proceed" }
  | { status: "reauth_required"; factors: VerifiedTotpFactor[] }
  | { status: "error"; message: string }

export async function prepareSensitiveUserCredentialsChange(
  supabase: SupabaseClient
): Promise<SensitiveCredentialsPrep> {
  try {
    const aal = await fetchCurrentAal(supabase)
    if (aal === "aal2") return { status: "proceed" }

    const { data: facData, error: facErr } = await supabase.auth.mfa.listFactors()
    if (facErr) {
      return { status: "error", message: mapListFactorsError(facErr) }
    }
    const factors = extractVerifiedTotpFactors(facData)
    if (factors.length === 0) return { status: "proceed" }

    return { status: "reauth_required", factors }
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Sicherheitsstatus konnte nicht geprüft werden.",
    }
  }
}

function mapListFactorsError(e: { message?: string }): string {
  const m = (e.message ?? "").toLowerCase()
  if (m.includes("session")) return "Sitzung ungültig. Bitte erneut anmelden."
  return "Authenticator-Liste konnte nicht geladen werden."
}

/**
 * TOTP-Challenge ausführen, Session refreshen, AAL2 verifizieren.
 */
export async function verifyTotpCodeAndRefreshToAal2(
  supabase: SupabaseClient,
  factorId: string,
  code: string
): Promise<void> {
  const trimmed = code.trim()
  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  })
  if (challengeError) throw challengeError

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code: trimmed,
  })
  if (verifyError) throw verifyError

  await supabase.auth.refreshSession()

  const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalError) throw aalError
  const level = parseAalFromAssuranceData(aalData)
  if (level !== "aal2") {
    throw new Error("AAL2 konnte nach der Verifizierung nicht bestätigt werden.")
  }
}

export type UserCredentialUpdate =
  | { kind: "password"; password: string }
  | { kind: "email"; email: string }

export async function applyUserCredentialUpdate(
  supabase: SupabaseClient,
  update: UserCredentialUpdate
): Promise<{ error: Error | null }> {
  if (update.kind === "password") {
    const { error } = await supabase.auth.updateUser({ password: update.password })
    return { error: error ? new Error(error.message) : null }
  }
  const { error } = await supabase.auth.updateUser({ email: update.email })
  return { error: error ? new Error(error.message) : null }
}

export type { AalLevel }
