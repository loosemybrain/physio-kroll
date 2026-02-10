import "server-only"
import { createClient } from "@supabase/supabase-js"

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set for Supabase server client.")
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set for Supabase server client.")
  // Use generic `any` for site_settings table (not yet in auto-generated types)
  return createClient<any>(url, key, { auth: { persistSession: false } })
}

/**
 * Load current sans font preset from the singleton row in public.site_settings.
 * Fallback: returns "inter-local" on error or missing value.
 */
export async function getSansFontPreset(): Promise<string> {
  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from("site_settings")
      .select("sans_preset")
      .eq("id", "singleton")
      .maybeSingle()
    
    if (error) throw error
    
    // Runtime type check
    const preset = (data as any)?.sans_preset
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
  const supabase = getSupabaseServer()
  
  // Try update first
  const { error: updateError } = await supabase
    .from("site_settings")
    .update({ sans_preset: presetId } as any)
    .eq("id", "singleton")

  // If update failed (row doesn't exist), insert instead
  if (updateError?.code === "PGRST116" || updateError?.code === "42P01") {
    const { error: insertErr } = await supabase
      .from("site_settings")
      .insert({ id: "singleton", sans_preset: presetId } as any)
    if (insertErr) {
      throw new Error("Failed to insert sans_preset in site_settings: " + insertErr.message)
    }
  } else if (updateError) {
    throw new Error("Failed to update sans_preset in site_settings: " + updateError.message)
  }
}