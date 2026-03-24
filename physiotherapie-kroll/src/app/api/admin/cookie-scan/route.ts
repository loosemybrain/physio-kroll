import { NextResponse } from "next/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase/server"

/** Stabile Defaults für einen Scan-Eintrag in der Liste (running/failed/null-safe). */
function mapScanRow(s: Record<string, unknown> | null): Record<string, unknown> | null {
  if (s == null || typeof s !== "object") return null
  return {
    id: s.id ?? "",
    targetUrl: s.target_url ?? "",
    environment: s.environment ?? "production",
    scannedAt: s.scanned_at ?? null,
    status: s.status ?? "failed",
    consentMode: s.consent_mode ?? "none",
    approvalStatus: s.approval_status ?? "draft",
    errorMessage: s.error_message ?? null,
    createdAt: s.created_at ?? null,
    updatedAt: s.updated_at ?? s.created_at ?? null,
  }
}

/**
 * GET /api/admin/cookie-scan
 * Liste aller Cookie-Scans (neueste zuerst). Nur Admin.
 * Robust: running, failed, null raw_result_json und leere Listen lösen keinen 500 aus.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }
    const admin = await getSupabaseAdmin()
    const { data: scans, error } = await admin
      .from("cookie_scans")
      .select("id, target_url, environment, scanned_at, status, consent_mode, approval_status, error_message, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Cookie scan GET error:", error)
      return NextResponse.json(
        { scans: [], error: "Scans konnten nicht geladen werden." },
        { status: 500 }
      )
    }

    const rawList = Array.isArray(scans) ? scans : []
    const list = rawList
      .map((s) => mapScanRow(s as Record<string, unknown>))
      .filter((item): item is Record<string, unknown> => item != null)

    return NextResponse.json({ scans: list })
  } catch (e) {
    console.error("Cookie scan list error:", e)
    return NextResponse.json(
      { scans: [], error: "Anfrage fehlgeschlagen." },
      { status: 500 }
    )
  }
}

const NIL_UUID = "00000000-0000-0000-0000-000000000000"

/**
 * DELETE /api/admin/cookie-scan
 * Entfernt alle Cookie-Scans (zugehörige cookie_scan_items per ON DELETE CASCADE).
 * Nur Admin.
 */
export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }
    const admin = await getSupabaseAdmin()
    const { error, count } = await admin
      .from("cookie_scans")
      .delete({ count: "exact" })
      .neq("id", NIL_UUID)

    if (error) {
      console.error("Cookie scan DELETE all error:", error)
      return NextResponse.json(
        { error: "Scans konnten nicht gelöscht werden." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      deletedScans: typeof count === "number" ? count : null,
    })
  } catch (e) {
    console.error("Cookie scan DELETE error:", e)
    return NextResponse.json({ error: "Anfrage fehlgeschlagen." }, { status: 500 })
  }
}
