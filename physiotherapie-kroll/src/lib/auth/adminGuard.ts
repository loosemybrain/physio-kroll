/**
 * Zentraler Admin-Guard für serverseitige Routen.
 * Sicherheit wird hier durchgesetzt – keine rein clientseitige Prüfung.
 *
 * Source of Truth für "ist Admin":
 * 1. auth.users.app_metadata.role === 'admin' (in Supabase Dashboard oder per API setzen)
 * 2. Fallback: E-Mail in ADMIN_EMAILS (Umgebungsvariable, kommagetrennt)
 *
 * Verwendung in API-Routen:
 *   const guard = await requireAdminGuard(supabase)
 *   if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status })
 *   const admin = await getSupabaseAdmin()
 *   // ... DB-Zugriffe mit admin (Service Role, umgeht RLS)
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"

export type AdminGuardResult =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403; message: string }

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS
  if (!raw || typeof raw !== "string") return []
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Prüft, ob der aktuelle Nutzer (über den Supabase-Client) Admin ist.
 * 401 = nicht eingeloggt, 403 = eingeloggt aber nicht Admin.
 */
export async function requireAdminGuard(
  supabase: SupabaseClient
): Promise<AdminGuardResult> {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error("Admin guard: auth error", error.message)
    return { ok: false, status: 401, message: "Nicht authentifiziert." }
  }

  if (!user) {
    return { ok: false, status: 401, message: "Nicht authentifiziert." }
  }

  const role = (user.app_metadata?.role as string) ?? ""
  if (role === "admin") {
    return { ok: true, user }
  }

  const adminEmails = getAdminEmails()
  const email = (user.email ?? "").toLowerCase()
  if (adminEmails.length > 0 && adminEmails.includes(email)) {
    return { ok: true, user }
  }

  return { ok: false, status: 403, message: "Keine Berechtigung." }
}
