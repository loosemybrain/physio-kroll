import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Service-Role-Client (umgeht RLS). Nur in Route Handlers / Server Actions aufrufen.
 * Dieses Modul darf niemals von Client-Bundles importiert werden.
 */
export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()

  if (!url) {
    throw new Error(
      "Supabase admin client: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) is not set."
    )
  }
  if (!key) {
    throw new Error("Supabase admin client: SUPABASE_SERVICE_ROLE_KEY is not set.")
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
