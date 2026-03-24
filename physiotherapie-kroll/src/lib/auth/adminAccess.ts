import type { SupabaseClient, User } from "@supabase/supabase-js"

type AAL = "aal1" | "aal2" | null

type FactorLike = {
  id?: string
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
  console.log("[ADMIN GATE] start", {
    userId: user?.id ?? null,
    email: user?.email ?? null,
  })

  const admin = isAdminUser(user)
  console.log("[ADMIN GATE] role", {
    isAdmin: admin,
  })

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
  let verifiedFactorIds: string[] = []
  let unverifiedFactorIds: string[] = []

  try {
    const { data } = await supabase.auth.mfa.listFactors()
    const allFactors = (data?.all ?? []) as FactorLike[]
    hasTotpFactor = allFactors.some(isTotpFactor)
    hasVerifiedTotpFactor = allFactors.some((f) => isTotpFactor(f) && isVerifiedFactor(f))
    const totpOnly = allFactors.filter(isTotpFactor)
    verifiedFactorIds = totpOnly
      .filter(isVerifiedFactor)
      .map((f) => f.id)
      .filter((id): id is string => Boolean(id))
    unverifiedFactorIds = totpOnly
      .filter((f) => (f.status ?? "").toLowerCase() === "unverified")
      .map((f) => f.id)
      .filter((id): id is string => Boolean(id))
    console.log("[ADMIN GATE] factors", {
      hasTotpFactor,
      hasVerifiedTotpFactor,
      verifiedFactorIds,
      unverifiedFactorIds,
    })
  } catch (e) {
    console.error("[ADMIN GATE] listFactors:error", e)
  }

  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    currentAal = readAalLevel(data)
    console.log("[ADMIN GATE] aal", {
      currentAal,
    })
  } catch (e) {
    console.error("[ADMIN GATE] aal:error", e)
  }

  return {
    isAdmin: true,
    hasTotpFactor,
    hasVerifiedTotpFactor,
    currentAal,
  }
}

