import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

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
    updatedAt: s.updated_at ?? null,
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: scans, error } = await supabase
      .from("cookie_scans")
      .select("id, target_url, environment, scanned_at, status, consent_mode, approval_status, error_message, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Cookie scan GET error:", error)
      return NextResponse.json(
        { scans: [], error: error.message },
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
      { scans: [], error: e instanceof Error ? e.message : "Unbekannter Fehler" },
      { status: 500 }
    )
  }
}
