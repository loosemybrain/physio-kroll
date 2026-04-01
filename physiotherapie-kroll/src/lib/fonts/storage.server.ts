import "server-only"

import { getSupabaseAdmin } from "@/lib/supabase/admin.server"

/**
 * Load current sans font preset from the singleton row in public.site_settings.
 * Fallback: returns "inter-local" on error or missing value.
 */
export async function getSansFontPreset(): Promise<string> {
  try {
    const supabase = await getSupabaseAdmin()
    const { data, error } = await supabase
      .from("site_settings")
      .select("sans_preset")
      .eq("id", "singleton")
      .maybeSingle()

    if (error) throw error

    const preset = (data as { sans_preset?: string } | null)?.sans_preset
    if (preset && typeof preset === "string") {
      return preset
    }
    return "inter-local"
  } catch {
    return "inter-local"
  }
}

/**
 * Update the sans font preset for the singleton row.
 * If the row does not exist, insert one.
 */
export async function setSansFontPreset(presetId: string): Promise<void> {
  const supabase = await getSupabaseAdmin()

  const { error: updateError } = await supabase
    .from("site_settings")
    .update({ sans_preset: presetId })
    .eq("id", "singleton")

  if (updateError?.code === "PGRST116" || updateError?.code === "42P01") {
    const { error: insertErr } = await supabase
      .from("site_settings")
      .insert({ id: "singleton", sans_preset: presetId })
    if (insertErr) {
      throw new Error("Failed to insert sans_preset in site_settings: " + insertErr.message)
    }
  } else if (updateError) {
    throw new Error("Failed to update sans_preset in site_settings: " + updateError.message)
  }
}

/**
 * Update the sans font preset (wrapper with error handling).
 * Returns true on success, false on error.
 */
export async function updateSansFontPreset(presetId: string): Promise<boolean> {
  try {
    await setSansFontPreset(presetId)
    return true
  } catch (error) {
    console.error("Failed to update sans font preset:", error)
    return false
  }
}
