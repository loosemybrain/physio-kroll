import type { SupabaseClient } from "@supabase/supabase-js"

export type AalLevel = "aal1" | "aal2" | null

export function parseAalFromAssuranceData(data: unknown): AalLevel {
  if (!data || typeof data !== "object") return null
  const level =
    ((data as { currentLevel?: string }).currentLevel ??
      (data as { current_level?: string }).current_level ??
      null) as string | null
  if (level === "aal1" || level === "aal2") return level
  return null
}

export async function fetchCurrentAal(supabase: SupabaseClient): Promise<AalLevel> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw error
  return parseAalFromAssuranceData(data)
}
