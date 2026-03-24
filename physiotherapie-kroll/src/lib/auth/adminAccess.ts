import type { SupabaseClient, User } from "@supabase/supabase-js"

type AAL = "aal1" | "aal2" | null

type FactorLike = {
  factor_type?: string
  factorType?: string
  status?: string
}

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS
  if (!raw || typeof raw !== "string") return []
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminUser(user: User | null): boolean {
  if (!user) return false
  const role = (user.app_metadata?.role as string) ?? ""
  if (role === "admin") return true
  const adminEmails = getAdminEmails()
  const email = (user.email ?? "").toLowerCase()
  return adminEmails.length > 0 && adminEmails.includes(email)
}

function isTotpFactor(f: FactorLike): boolean {
  const type = (f.factor_type ?? f.factorType ?? "").toLowerCase()
  return type === "totp"
}

function isVerifiedFactor(f: FactorLike): boolean {
  return (f.status ?? "").toLowerCase() === "verified"
}

function readAalLevel(data: unknown): AAL {
  if (!data || typeof data !== "object") return null
  const level =
    ((data as { currentLevel?: string }).currentLevel ??
      (data as { current_level?: string }).current_level ??
      null) as string | null
  if (level === "aal1" || level === "aal2") return level
  return null
}

export type AdminMfaState = {
  isAdmin: boolean
  hasTotpFactor: boolean
  hasVerifiedTotpFactor: boolean
  currentAal: AAL
}

export async function getAdminMfaState(
  supabase: SupabaseClient,
  user: User | null
): Promise<AdminMfaState> {
  const admin = isAdminUser(user)
  if (!admin) {
    return {
      isAdmin: false,
      hasTotpFactor: false,
      hasVerifiedTotpFactor: false,
      currentAal: null,
    }
  }

  let hasTotpFactor = false
  let hasVerifiedTotpFactor = false
  let currentAal: AAL = null

  try {
    const { data } = await supabase.auth.mfa.listFactors()
    const allFactors = (data?.all ?? []) as FactorLike[]
    hasTotpFactor = allFactors.some(isTotpFactor)
    hasVerifiedTotpFactor = allFactors.some((f) => isTotpFactor(f) && isVerifiedFactor(f))
  } catch (e) {
    console.error("MFA listFactors fehlgeschlagen:", e)
  }

  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    currentAal = readAalLevel(data)
  } catch (e) {
    console.error("MFA AAL-Check fehlgeschlagen:", e)
  }

  return {
    isAdmin: true,
    hasTotpFactor,
    hasVerifiedTotpFactor,
    currentAal,
  }
}

