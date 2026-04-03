// Kein "server-only": wird auch vom Login-Client importiert; nutzt nur den übergebenen Client (kein Service Role).

import type { SupabaseClient, User } from "@supabase/supabase-js"
import { parseAalFromAssuranceData, type AalLevel } from "@/lib/auth/mfaAal"

type AAL = AalLevel

type FactorLike = {
  id?: string
  factor_type?: string
  factorType?: string
  status?: string
}

/**
 * Einzige produktive Admin-Quelle: `public.admin_users` (Abfrage via RPC `public.is_admin`).
 * Kein ENV-E-Mail-Fallback, kein app_metadata.role.
 */
export async function isUserAdminInDatabase(supabase: SupabaseClient, userId: string): Promise<boolean> {
  if (!userId) return false
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId })
  if (error) {
    console.error("is_admin RPC error:", error.message)
    return false
  }
  return data === true
}

function isTotpFactor(f: FactorLike): boolean {
  const type = (f.factor_type ?? f.factorType ?? "").toLowerCase()
  return type === "totp"
}

function isVerifiedFactor(f: FactorLike): boolean {
  return (f.status ?? "").toLowerCase() === "verified"
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
  if (!user?.id) {
    return {
      isAdmin: false,
      hasTotpFactor: false,
      hasVerifiedTotpFactor: false,
      currentAal: null,
    }
  }

  const admin = await isUserAdminInDatabase(supabase, user.id)
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
    console.error("getAdminMfaState listFactors error:", e)
  }

  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    currentAal = parseAalFromAssuranceData(data)
  } catch (e) {
    console.error("getAdminMfaState aal error:", e)
  }

  return {
    isAdmin: true,
    hasTotpFactor,
    hasVerifiedTotpFactor,
    currentAal,
  }
}
