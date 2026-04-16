import "server-only"

import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin.server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"

export function isUuidString(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

export type VerifiedAdminServiceContext = {
  sessionClient: SupabaseClient
  adminClient: SupabaseClient
  user: User
}

export type RequireAdminWithServiceRoleResult =
  | { ok: true; ctx: VerifiedAdminServiceContext }
  | { ok: false; response: NextResponse }

/**
 * Session-Client: Auth-Identität.
 * Service-Role-Client: privilegierte DB-Ops erst nach bestandenem Admin-Guard (RBAC via public.is_admin).
 */
export async function requireAdminWithServiceRole(): Promise<RequireAdminWithServiceRoleResult> {
  const sessionClient = await createSupabaseServerClient()
  const guard = await requireAdminGuard(sessionClient)
  if (!guard.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: guard.message }, { status: guard.status }),
    }
  }

  try {
    const adminClient = await getSupabaseAdmin()
    return {
      ok: true,
      ctx: { sessionClient, adminClient, user: guard.user },
    }
  } catch (e) {
    console.error("admin route: getSupabaseAdmin failed", e)
    return {
      ok: false,
      response: NextResponse.json({ error: "Server configuration error." }, { status: 500 }),
    }
  }
}
