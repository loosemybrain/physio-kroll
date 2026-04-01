import "server-only"

/**
 * Zentraler Admin-Guard für serverseitige Routen.
 * Source of Truth: `public.admin_users`, geprüft via RPC `public.is_admin(_user_id)`.
 *
 * Verwendung:
 *   const supabase = await createSupabaseServerClient()
 *   const guard = await requireAdminGuard(supabase)
 *   if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status })
 *   const admin = await getSupabaseAdmin() // aus @/lib/supabase/admin.server
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import { isUserAdminInDatabase } from "@/lib/auth/adminAccess"

export type AdminGuardResult =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403; message: string }

/**
 * 401 = nicht eingeloggt, 403 = eingeloggt aber nicht in admin_users.
 */
export async function requireAdminGuard(supabase: SupabaseClient): Promise<AdminGuardResult> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error("Admin guard: auth error", error.message)
    return { ok: false, status: 401, message: "Nicht authentifiziert." }
  }

  if (!user?.id) {
    return { ok: false, status: 401, message: "Nicht authentifiziert." }
  }

  const admin = await isUserAdminInDatabase(supabase, user.id)
  if (admin) {
    return { ok: true, user }
  }

  return { ok: false, status: 403, message: "Keine Berechtigung." }
}
