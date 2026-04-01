"use client"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/**
 * Zentraler Browser-Client (SSR-Cookies, gleiche Validierung wie überall).
 * Für neuen Code direkt `getSupabaseBrowserClient` / `createSupabaseBrowserClient` aus `@/lib/supabase/client` nutzen.
 */
export function getFontsSupabaseClient(): SupabaseClient<Database> {
  return getSupabaseBrowserClient() as unknown as SupabaseClient<Database>
}
