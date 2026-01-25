import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Server-owned sign-out.
 * Clears auth cookies (including HttpOnly) so the client never needs refresh tokens.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut().catch(() => {})
  return NextResponse.json({ ok: true })
}
