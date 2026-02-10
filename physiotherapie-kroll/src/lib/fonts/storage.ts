/**
 * Font Presets Supabase Storage & Functions
 * Handles reading/writing sans_preset to site_settings singleton table
 */

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

/**
 * Server-side Supabase client (with service role for reading settings)
 */
export const supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

/**
 * Client-side Supabase client (read-only for public)
 */
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)

/**
 * Get current sans_preset (server-side, SSR-safe)
 * Falls back to "inter-local" if no setting exists
 */
export async function getSansFontPreset(): Promise<string> {
  try {
    const { data, error } = await supabaseServer
      .from("site_settings")
      .select("sans_preset")
      .single()

    if (error) {
      console.warn("Font preset not found, using default:", error.message)
      return "inter-local"
    }

    return data?.sans_preset || "inter-local"
  } catch (err) {
    console.error("Error fetching font preset:", err)
    return "inter-local"
  }
}

/**
 * Update sans_preset (admin-only, should be called via API route with auth check)
 */
export async function updateSansFontPreset(presetId: string): Promise<boolean> {
  try {
    const { error } = await supabaseServer
      .from("site_settings")
      .upsert({ sans_preset: presetId }, { onConflict: "id" })

    if (error) {
      console.error("Error updating font preset:", error)
      return false
    }
    return true
  } catch (err) {
    console.error("Error in updateSansFontPreset:", err)
    return false
  }
}

/**
 * Initialize site_settings if it doesn't exist
 * Should be called once during app setup
 */
export async function initializeSiteSettings(): Promise<void> {
  try {
    const { data } = await supabaseServer
      .from("site_settings")
      .select("id")
      .single()

    if (!data) {
      await supabaseServer.from("site_settings").insert({
        sans_preset: "inter-local",
      })
    }
  } catch (err) {
    console.error("Error initializing site settings:", err)
  }
}
